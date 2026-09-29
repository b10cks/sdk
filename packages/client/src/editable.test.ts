// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  type AttachEditableFieldOptions,
  type AttachEditableOptions,
  attachEditable as attachEditableRaw,
  attachEditableField as attachEditableFieldRaw,
} from './editable'
import { previewBridge } from './preview-bridge'

const EDITOR_ORIGIN = 'https://editor.b10cks.test'

let postMessage: ReturnType<typeof vi.fn>
const cleanups: (() => void)[] = []

// Editables share one controller, so every test detaches what it attached.
function attachEditable(el: HTMLElement, options: AttachEditableOptions) {
  const cleanup = attachEditableRaw(el, options)
  cleanups.push(cleanup)
  return cleanup
}

function attachEditableField(el: HTMLElement, options: AttachEditableFieldOptions) {
  const cleanup = attachEditableFieldRaw(el, options)
  cleanups.push(cleanup)
  return cleanup
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

function overlay() {
  const root = document.getElementById('b10cks-overlay')?.shadowRoot
  if (!root) throw new Error('overlay not rendered')
  return root
}

function overlayLabels() {
  return [...overlay().querySelectorAll<HTMLElement>('.box:not([hidden]) .name')].map(
    (label) => label.textContent
  )
}

function toolbarButton(label: string) {
  const button = overlay().querySelector<HTMLButtonElement>(`.tool[aria-label="${label}"]`)
  if (!button) throw new Error(`no toolbar button "${label}"`)
  return button
}

/** Payloads the preview posted to the editor for `type`. */
function posted(type: string) {
  return postMessage.mock.calls
    .map(([message]) => message as { type: string; payload: unknown })
    .filter((message) => message.type === type)
    .map((message) => message.payload)
}

/** A page block with three sibling blocks, the middle one holding a card. */
function renderPage() {
  document.body.innerHTML = `
    <main id="page">
      <section id="b1"></section>
      <section id="b2"><div id="card"><a id="link" href="/elsewhere">Go</a></div></section>
      <section id="b3"></section>
    </main>`
  const el = (id: string) => document.getElementById(id) as HTMLElement
  attachEditable(el('page'), { id: 'page', label: 'page', scrollOnSelect: false })
  for (const id of ['b1', 'b2', 'b3']) {
    attachEditable(el(id), { id, label: 'section', scrollOnSelect: false })
  }
  attachEditable(el('card'), { id: 'card', label: 'card', scrollOnSelect: false })
  return el
}

async function selectBlock(el: HTMLElement) {
  el.click()
  await nextFrame()
}

function enterPreviewMode() {
  postMessage = vi.fn()
  Object.defineProperty(window, 'top', { value: {}, configurable: true })
  Object.defineProperty(window, 'parent', { value: { postMessage }, configurable: true })
}

function leavePreviewMode() {
  Object.defineProperty(window, 'top', { value: window, configurable: true })
}

/** Push an editor-origin event through the real bridge. */
function dispatchBridgeEvent(type: string, payload: unknown) {
  window.dispatchEvent(
    new MessageEvent('message', { data: { type, payload }, origin: EDITOR_ORIGIN })
  )
}

beforeEach(() => {
  enterPreviewMode()
  previewBridge.init()
})

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  previewBridge.destroy()
  leavePreviewMode()
  document.body.innerHTML = ''
})

describe('attachEditable', () => {
  it('is a no-op outside preview mode', () => {
    previewBridge.destroy()
    leavePreviewMode()
    postMessage.mockClear()
    const el = document.createElement('div')
    const cleanup = attachEditable(el, { id: 'b1' })

    el.click()

    expect(el.classList.contains('b10cks-preview')).toBe(false)
    expect(postMessage).not.toHaveBeenCalled()
    expect(typeof cleanup).toBe('function')
  })

  it('selects the block in the editor on click', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    attachEditable(el, { id: 'b1' })

    expect(el.classList.contains('b10cks-preview')).toBe(true)
    el.click()

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'SELECT_UPDATE', payload: { selectedItem: 'b1' } },
      '*'
    )
  })

  it('toggles the selected class and fires the callback on SELECT_UPDATE', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSelectChange = vi.fn()
    attachEditable(el, { id: 'b1', onSelectChange, scrollOnSelect: false })

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    expect(el.classList.contains('b10cks-selected')).toBe(true)
    expect(onSelectChange).toHaveBeenLastCalledWith(true)

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'other' })
    expect(el.classList.contains('b10cks-selected')).toBe(false)
    expect(onSelectChange).toHaveBeenLastCalledWith(false)
  })

  it('cleanup removes classes and stops reacting to events', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const onSelectChange = vi.fn()
    const cleanup = attachEditable(el, { id: 'b1', onSelectChange, scrollOnSelect: false })

    cleanup()
    expect(el.classList.contains('b10cks-preview')).toBe(false)

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    expect(onSelectChange).not.toHaveBeenCalled()

    postMessage.mockClear()
    el.click()
    expect(postMessage).not.toHaveBeenCalled()
  })

  it('highlights only the innermost element of a selected block', () => {
    document.body.innerHTML = '<section id="outer"><div id="inner"></div></section>'
    const outer = document.getElementById('outer') as HTMLElement
    const inner = document.getElementById('inner') as HTMLElement
    attachEditable(outer, { id: 'b1', scrollOnSelect: false })
    attachEditable(inner, { id: 'b1', scrollOnSelect: false })

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })

    expect(inner.classList.contains('b10cks-selected')).toBe(true)
    expect(outer.classList.contains('b10cks-selected')).toBe(false)
  })

  it('selects the innermost block on click without triggering links or their handlers', () => {
    document.body.innerHTML =
      '<section id="outer"><div id="inner"><a id="link" href="/elsewhere">Go</a></div></section>'
    const outer = document.getElementById('outer') as HTMLElement
    const inner = document.getElementById('inner') as HTMLElement
    const link = document.getElementById('link') as HTMLElement
    attachEditable(outer, { id: 'outer', scrollOnSelect: false })
    attachEditable(inner, { id: 'inner', scrollOnSelect: false })
    const linkHandler = vi.fn()
    link.addEventListener('click', linkHandler)

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(true)
    expect(linkHandler).not.toHaveBeenCalled()
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'SELECT_UPDATE', payload: { selectedItem: 'inner' } },
      '*'
    )
    expect(inner.classList.contains('b10cks-selected')).toBe(true)
    expect(outer.classList.contains('b10cks-selected')).toBe(false)
  })

  it('leaves clicks outside editables alone', () => {
    document.body.innerHTML = '<a id="link" href="#top">Top</a><div id="block"></div>'
    attachEditable(document.getElementById('block') as HTMLElement, { id: 'b1' })

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    document.getElementById('link')?.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(false)
    expect(postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SELECT_UPDATE' }),
      expect.anything()
    )
  })

  it('labels the selection with the block type', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    attachEditable(el, { id: 'b1', label: 'hero_section', scrollOnSelect: false })

    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    await nextFrame()

    expect(overlayLabels()).toEqual(['Hero section'])
  })

  it('prefers the display name the editor sent for the block type', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    dispatchBridgeEvent('BLOCK_LABELS', { labels: { hero_section: 'Hero banner' } })
    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    attachEditable(el, { id: 'b1', label: 'hero_section', scrollOnSelect: false })
    await Promise.resolve()
    await nextFrame()

    expect(overlayLabels()).toEqual(['Hero banner'])
  })

  it('selects a block that mounts after the editor selected it', async () => {
    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    attachEditable(document.createElement('div'), { id: 'other' })

    const el = document.createElement('div')
    document.body.appendChild(el)
    attachEditable(el, { id: 'b1', scrollOnSelect: false })
    await Promise.resolve()

    expect(el.classList.contains('b10cks-selected')).toBe(true)
  })
})

describe('attachEditableField', () => {
  it('makes the element contenteditable and streams input by path', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    // Lock the bridge origin so posts target the editor.
    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'noop' })

    attachEditableField(el, { id: 'b1', path: ['title'] })
    expect(el.getAttribute('contenteditable')).toBe('true')

    el.innerText = 'Edited'
    el.dispatchEvent(new Event('input'))

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'FIELD_UPDATE', payload: { itemId: 'b1', path: ['title'], value: 'Edited' } },
      EDITOR_ORIGIN
    )
  })

  it('in select mode, deep-selects the field instead of editing inline', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    attachEditableField(el, { id: 'b1', path: ['body'], mode: 'select' })

    expect(el.getAttribute('contenteditable')).toBeNull()
    el.click()

    expect(postMessage).toHaveBeenCalledWith(
      { type: 'FIELD_SELECT', payload: { itemId: 'b1', path: ['body'] } },
      '*'
    )
  })

  it('in select mode, labels the field and wins over its block', async () => {
    document.body.innerHTML = '<section id="block"><div id="field"></div></section>'
    const block = document.getElementById('block') as HTMLElement
    const field = document.getElementById('field') as HTMLElement
    attachEditable(block, { id: 'b1', label: 'hero', scrollOnSelect: false })
    attachEditableField(field, { id: 'b1', path: ['body', 0, 'rich_text'], mode: 'select' })

    field.click()
    await nextFrame()

    expect(field.classList.contains('b10cks-selected')).toBe(true)
    expect(block.classList.contains('b10cks-selected')).toBe(false)
    expect(overlayLabels()).toEqual(['Rich text'])
  })

  it('keeps the field selected when the editor then selects its block', async () => {
    document.body.innerHTML = '<section id="block"><div id="field"></div></section>'
    const block = document.getElementById('block') as HTMLElement
    const field = document.getElementById('field') as HTMLElement
    attachEditable(block, { id: 'b1', label: 'hero', scrollOnSelect: false })
    attachEditableField(field, { id: 'b1', path: ['body'], mode: 'select' })

    field.click()
    dispatchBridgeEvent('SELECT_UPDATE', { selectedItem: 'b1' })
    await nextFrame()

    expect(field.classList.contains('b10cks-selected')).toBe(true)
    expect(block.classList.contains('b10cks-selected')).toBe(false)
  })
})

describe('selection toolbar', () => {
  it('posts the block action for the selected block', async () => {
    const el = renderPage()
    await selectBlock(el('b2'))

    toolbarButton('Move up').click()
    toolbarButton('Delete').click()

    expect(posted('BLOCK_ACTION')).toEqual([
      { itemId: 'b2', action: 'move-up' },
      { itemId: 'b2', action: 'delete' },
    ])
  })

  it('disables moving the first block up and the last block down', async () => {
    const el = renderPage()

    await selectBlock(el('b1'))
    expect(toolbarButton('Move up').disabled).toBe(true)
    expect(toolbarButton('Move down').disabled).toBe(false)

    await selectBlock(el('b3'))
    expect(toolbarButton('Move up').disabled).toBe(false)
    expect(toolbarButton('Move down').disabled).toBe(true)
  })

  it('has no toolbar for a selected field', async () => {
    const el = renderPage()
    const field = document.createElement('p')
    el('b1').appendChild(field)
    attachEditableField(field, { id: 'b1', path: ['body'], mode: 'select' })

    await selectBlock(field)

    expect(overlay().querySelector('.tools')?.hasAttribute('hidden')).toBe(true)
  })
})

describe('hidden blocks', () => {
  it('dims the blocks the editor hides, including ones mounted later', () => {
    const el = renderPage()
    dispatchBridgeEvent('HIDDEN_BLOCKS', { ids: ['b2', 'late'] })

    expect(el('b2').classList.contains('b10cks-hidden')).toBe(true)
    expect(el('b1').classList.contains('b10cks-hidden')).toBe(false)

    const late = document.createElement('section')
    document.body.appendChild(late)
    const detach = attachEditable(late, { id: 'late' })
    expect(late.classList.contains('b10cks-hidden')).toBe(true)

    dispatchBridgeEvent('HIDDEN_BLOCKS', { ids: ['late'] })
    expect(el('b2').classList.contains('b10cks-hidden')).toBe(false)

    detach()
    expect(late.classList.contains('b10cks-hidden')).toBe(false)
  })

  it('has no visibility toggle until the editor sends hidden blocks', async () => {
    const el = renderPage()
    await selectBlock(el('b2'))

    expect(overlay().querySelector('.tool[aria-label="Hide"]')?.hasAttribute('hidden')).toBe(true)
  })

  it('asks the editor to hide or show the selected block', async () => {
    const el = renderPage()
    dispatchBridgeEvent('HIDDEN_BLOCKS', { ids: [] })
    await selectBlock(el('b2'))

    const hide = toolbarButton('Hide')
    expect(hide.hidden).toBe(false)
    expect(hide.getAttribute('aria-pressed')).toBe('false')
    hide.click()

    dispatchBridgeEvent('HIDDEN_BLOCKS', { ids: ['b2'] })
    await nextFrame()
    const show = toolbarButton('Show')
    expect(show.getAttribute('aria-pressed')).toBe('true')
    show.click()

    expect(posted('BLOCK_ACTION')).toEqual([
      { itemId: 'b2', action: 'hide' },
      { itemId: 'b2', action: 'show' },
    ])
  })
})

describe('alt-click', () => {
  it('passes the click through to the page without selecting', () => {
    const el = renderPage()
    const linkHandler = vi.fn()
    el('link').addEventListener('click', linkHandler)

    const click = new MouseEvent('click', { bubbles: true, cancelable: true, altKey: true })
    el('link').dispatchEvent(click)

    expect(click.defaultPrevented).toBe(false)
    expect(linkHandler).toHaveBeenCalled()
    expect(posted('SELECT_UPDATE')).toEqual([])
    expect(el('card').classList.contains('b10cks-selected')).toBe(false)
  })
})

describe('breadcrumb and keyboard navigation', () => {
  function crumbs() {
    return [...overlay().querySelectorAll<HTMLButtonElement>('.crumb')]
  }

  function press(key: string, target: EventTarget = document.body) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    target.dispatchEvent(event)
    return event
  }

  it('shows the ancestor blocks and selects one on click', async () => {
    const el = renderPage()
    await selectBlock(el('card'))

    expect(crumbs().map((crumb) => crumb.textContent)).toEqual(['Page', 'Section'])
    expect(overlayLabels()).toEqual(['Card'])

    crumbs()[0]?.click()

    expect(posted('SELECT_UPDATE').at(-1)).toEqual({ selectedItem: 'page' })
    expect(el('page').classList.contains('b10cks-selected')).toBe(true)
  })

  it('collapses long chains', async () => {
    document.body.innerHTML =
      '<div id="a"><div id="b"><div id="c"><div id="d"><div id="e"></div></div></div></div></div>'
    for (const id of ['a', 'b', 'c', 'd', 'e']) {
      attachEditable(document.getElementById(id) as HTMLElement, {
        id,
        label: id,
        scrollOnSelect: false,
      })
    }
    await selectBlock(document.getElementById('e') as HTMLElement)

    expect(overlay().querySelector('.more')?.getAttribute('title')).toBe('A')
    expect(crumbs().map((crumb) => crumb.textContent)).toEqual(['B', 'C', 'D'])
  })

  it('selects the parent on Escape and siblings on the arrow keys', async () => {
    const el = renderPage()
    await selectBlock(el('b2'))

    expect(press('ArrowDown').defaultPrevented).toBe(true)
    expect(el('b3').classList.contains('b10cks-selected')).toBe(true)

    press('ArrowUp')
    press('ArrowUp')
    expect(el('b1').classList.contains('b10cks-selected')).toBe(true)
    // Nothing before the first block: the key is left to the page.
    expect(press('ArrowUp').defaultPrevented).toBe(false)

    press('Escape')
    expect(el('page').classList.contains('b10cks-selected')).toBe(true)
    expect(posted('SELECT_UPDATE')).toEqual([
      { selectedItem: 'b2' },
      { selectedItem: 'b3' },
      { selectedItem: 'b2' },
      { selectedItem: 'b1' },
      { selectedItem: 'page' },
    ])
  })

  it('leaves keys alone while typing', async () => {
    const el = renderPage()
    const input = document.createElement('input')
    el('b2').appendChild(input)
    await selectBlock(el('b2'))

    expect(press('Escape', input).defaultPrevented).toBe(false)
    expect(el('b2').classList.contains('b10cks-selected')).toBe(true)
  })
})

describe('drag and drop', () => {
  /** Lay the page's sections out as stacked 100px rows. */
  function layout(el: (id: string) => HTMLElement) {
    const rows = { page: [0, 300], b1: [0, 100], b2: [100, 200], card: [110, 190], b3: [200, 300] }
    for (const [id, [top, bottom]] of Object.entries(rows)) {
      vi.spyOn(el(id), 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ x: 0, y: top, width: 800, height: bottom - top })
      )
    }
    const hits = ['card', 'b1', 'b2', 'b3']
    document.elementsFromPoint = (_x: number, y: number) => {
      const id = hits.find((hit) => {
        const rect = el(hit).getBoundingClientRect()
        return y >= rect.top && y < rect.bottom
      })
      return id ? [el(id)] : []
    }
  }

  async function startDrag(el: (id: string) => HTMLElement, id: string) {
    layout(el)
    await selectBlock(el(id))
    const handle = overlay().querySelector('.handle') as HTMLElement
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, composed: true, cancelable: true })
    )
  }

  function pointer(type: string, y: number) {
    window.dispatchEvent(new PointerEvent(type, { clientX: 10, clientY: y }))
  }

  it('moves the block before or after the block it is dropped on', async () => {
    const el = renderPage()
    await startDrag(el, 'b1')

    pointer('pointermove', 280)
    await nextFrame()
    expect(overlay().querySelector('.indicator')?.hasAttribute('hidden')).toBe(false)
    pointer('pointerup', 280)

    await startDrag(el, 'b3')
    pointer('pointerup', 20)

    expect(posted('BLOCK_MOVE')).toEqual([
      { itemId: 'b1', targetId: 'b3', position: 'after' },
      { itemId: 'b3', targetId: 'b1', position: 'before' },
    ])
  })

  it('rejects drops on the block itself, its descendants, or its ancestors', async () => {
    const el = renderPage()
    await startDrag(el, 'card')
    // Over the card's parent section, around the card.
    pointer('pointermove', 105)
    pointer('pointerup', 105)

    await startDrag(el, 'b2')
    pointer('pointermove', 150)
    await nextFrame()
    expect(overlay().querySelector('.indicator')?.hasAttribute('hidden')).toBe(true)
    pointer('pointerup', 150)

    expect(posted('BLOCK_MOVE')).toEqual([])
  })

  it('cancels on Escape', async () => {
    const el = renderPage()
    await startDrag(el, 'b1')

    pointer('pointermove', 250)
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    pointer('pointerup', 250)

    expect(posted('BLOCK_MOVE')).toEqual([])
    expect(el('b1').classList.contains('b10cks-selected')).toBe(true)
  })
})
