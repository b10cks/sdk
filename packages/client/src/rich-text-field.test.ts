// @vitest-environment happy-dom
import { type RichTextDocument, renderRichText } from '@b10cks/richtext'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { attachEditable } from './editable'
import { previewBridge } from './preview-bridge'
import { attachRichTextField } from './rich-text-field'

const editorLoads = vi.hoisted(() => ({ count: 0 }))

vi.mock('@b10cks/richtext/editor', async (importOriginal) => {
  editorLoads.count++
  return importOriginal()
})

/** Tiptap keeps its editor on the element it mounts. */
type EditorElement = HTMLElement & {
  editor?: { commands: { focus: (at: 'end') => boolean; insertContent: (text: string) => boolean } }
}

/** Type at the end of the field. */
function type(el: EditorElement, text: string) {
  el.editor?.commands.focus('end')
  el.editor?.commands.insertContent(text)
}

const ID = 'hero-1'
const PATH = ['body']

let postMessage: ReturnType<typeof vi.fn>
const cleanups: (() => void)[] = []

function paragraph(text: string): RichTextDocument {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

/** A hero block holding a rich text field, attached the way the framework components do. */
function renderField(document = paragraph('Hello')) {
  window.document.body.innerHTML = `<section id="hero"><div id="body"></div></section>`
  const block = window.document.getElementById('hero') as HTMLElement
  const el = window.document.getElementById('body') as EditorElement
  el.innerHTML = renderRichText(document)
  cleanups.push(attachEditable(block, { id: ID, label: 'hero', scrollOnSelect: false }))
  const onEditingChange = vi.fn()
  const handle = attachRichTextField(el, { id: ID, path: PATH, document, onEditingChange })
  cleanups.push(handle.destroy)
  return { el, handle, onEditingChange }
}

function posted(type: string) {
  return postMessage.mock.calls
    .map(([message]) => message as { type: string; payload: unknown })
    .filter((message) => message.type === type)
    .map((message) => message.payload)
}

function dispatchBridgeEvent(type: string, payload: unknown) {
  window.dispatchEvent(new MessageEvent('message', { data: { type, payload } }))
}

async function startEditing(el: EditorElement) {
  el.click()
  dispatchBridgeEvent('FIELD_CONFIG', { itemId: ID, path: PATH, richtext: {} })
  await vi.waitFor(() => expect(el.getAttribute('contenteditable')).toBe('true'))
}

beforeEach(() => {
  postMessage = vi.fn()
  Object.defineProperty(window, 'top', { value: {}, configurable: true })
  Object.defineProperty(window, 'parent', { value: { postMessage }, configurable: true })
  previewBridge.init()
})

afterEach(() => {
  vi.useRealTimers()
  for (const cleanup of cleanups.splice(0)) cleanup()
  previewBridge.destroy()
  Object.defineProperty(window, 'top', { value: window, configurable: true })
  document.body.innerHTML = ''
})

describe('attachRichTextField', () => {
  // Runs first: the editor module is cached once loaded.
  it('never loads the editor outside preview mode', async () => {
    Object.defineProperty(window, 'top', { value: window, configurable: true })
    const { el } = renderField()

    el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }))
    el.click()
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(editorLoads.count).toBe(0)
    expect(el.getAttribute('contenteditable')).toBeNull()
    expect(postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'FIELD_SELECT' }),
      expect.anything()
    )
  })

  it('edits in place once the editor sends the field config', async () => {
    const { el, onEditingChange } = renderField()

    await startEditing(el)

    expect(posted('FIELD_SELECT')).toEqual([{ itemId: ID, path: PATH }])
    expect(onEditingChange).toHaveBeenCalledWith(true)
    expect(editorLoads.count).toBe(1)
  })

  it('stays a selectable field when the editor sends no config', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const { el, onEditingChange } = renderField()

    el.click()
    await vi.advanceTimersByTimeAsync(2000)

    expect(posted('FIELD_SELECT')).toEqual([{ itemId: ID, path: PATH }])
    expect(el.getAttribute('contenteditable')).toBeNull()
    expect(onEditingChange).not.toHaveBeenCalled()
  })

  it('streams edits as FIELD_UPDATE and applies them to its own content', async () => {
    const { el } = renderField()
    const localPatch = vi.fn()
    cleanups.push(previewBridge.on('CONTENT_PATCH', localPatch))
    await startEditing(el)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    type(el, '!')
    type(el, '!')
    expect(posted('FIELD_UPDATE')).toEqual([])

    await vi.advanceTimersByTimeAsync(300)

    const update = { itemId: ID, path: PATH, value: paragraph('Hello!!') }
    expect(posted('FIELD_UPDATE')).toEqual([update])
    expect(localPatch).toHaveBeenCalledWith(update)
  })

  it('sends pending edits right away on blur', async () => {
    const { el } = renderField()
    await startEditing(el)

    type(el, '!')
    el.dispatchEvent(new FocusEvent('blur'))

    expect(posted('FIELD_UPDATE')).toEqual([{ itemId: ID, path: PATH, value: paragraph('Hello!') }])
  })

  it('applies changes from the editor without sending them back', async () => {
    const { el, handle } = renderField()
    await startEditing(el)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    handle.update(paragraph('Hello from the CMS'))
    await vi.advanceTimersByTimeAsync(300)

    expect(el.textContent).toBe('Hello from the CMS')
    expect(el.getAttribute('contenteditable')).toBe('true')
    expect(posted('FIELD_UPDATE')).toEqual([])
  })

  it('ignores its own edits coming back', async () => {
    const { el, handle } = renderField()
    await startEditing(el)

    type(el, '!')
    el.dispatchEvent(new FocusEvent('blur'))
    type(el, '?')
    // The editor's copy of the first edit arrives after more typing.
    handle.update(paragraph('Hello!'))

    expect(el.textContent).toBe('Hello!?')
  })

  it('lets clicks inside the active editor through', async () => {
    const { el } = renderField()
    await startEditing(el)
    const paragraphEl = el.querySelector('p') as HTMLElement

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    paragraphEl.dispatchEvent(click)

    expect(click.defaultPrevented).toBe(false)
    expect(posted('FIELD_SELECT')).toHaveLength(1)
  })

  it('returns to block selection on Escape, leaving the edit rendered', async () => {
    const { el, onEditingChange } = renderField()
    await startEditing(el)
    type(el, '!')

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(el.getAttribute('contenteditable')).toBeNull()
    expect(el.innerHTML).toBe('<p>Hello!</p>')
    expect(onEditingChange).toHaveBeenLastCalledWith(false)
    expect(posted('FIELD_UPDATE')).toEqual([{ itemId: ID, path: PATH, value: paragraph('Hello!') }])
    expect(posted('SELECT_UPDATE')).toEqual([{ selectedItem: ID }])
  })

  it('stops editing when something else gets selected', async () => {
    const { el } = renderField()
    await startEditing(el)

    ;(document.getElementById('hero') as HTMLElement).click()

    expect(el.getAttribute('contenteditable')).toBeNull()
  })
})
