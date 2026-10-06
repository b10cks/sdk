// @vitest-environment happy-dom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { TiptapEditorHTMLElement } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type RichTextDocument, type RichTextFieldConfig, renderRichText } from '../index'
import { createRichTextEditor, type RichTextEditor } from './index'

/**
 * Schema parity with the CMS editor. The fixture is shared byte-identical with
 * the CMS repo (tests/fixtures/richtext-documents.json), whose suite runs the
 * same documents through its own Tiptap editor.
 */
const fixture: {
  documents: { name: string; document: RichTextDocument }[]
  rejected: { name: string; config: RichTextFieldConfig; document: RichTextDocument }[]
} = JSON.parse(
  readFileSync(join(__dirname, '../../../client/src/__fixtures__/richtext-documents.json'), 'utf8')
)

let editor: RichTextEditor | null = null

afterEach(() => {
  editor?.destroy()
  editor = null
  document.body.innerHTML = ''
})

function mount(doc: RichTextDocument, config?: RichTextFieldConfig, onChange = vi.fn()) {
  const el = document.createElement('div')
  el.className = 'prose'
  el.innerHTML = renderRichText(doc)
  document.body.appendChild(el)
  const rendered = el.innerHTML
  editor = createRichTextEditor(el, { document: doc, config, onChange })
  return { el, onChange, rendered }
}

/** Tiptap keeps its editor on the element it mounts. */
function viewOf(el: TiptapEditorHTMLElement): EditorView {
  const view = el.editor?.view
  if (!view) throw new Error('No editor mounted')
  return view
}

function paragraph(text: string): RichTextDocument {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

/** Every node and mark in `doc`, with the attributes it carries. */
function* parts(
  doc: RichTextDocument
): Generator<{ kind: 'node' | 'mark'; sample: RichTextDocument }> {
  yield { kind: 'node', sample: doc }
  for (const mark of doc.marks ?? []) {
    yield { kind: 'mark', sample: { type: 'text', text: 'x', marks: [mark] } }
  }
  for (const child of doc.content ?? []) yield* parts(child)
}

describe('rich text fixture', () => {
  it.each(fixture.documents)('round-trips "$name" unchanged', ({ document: doc }) => {
    mount(doc)

    expect(editor?.getDocument()).toEqual(doc)
  })

  it.each(fixture.documents)('renders every node and mark of "$name"', ({ document: doc }) => {
    for (const { kind, sample } of parts(doc)) {
      if (sample.type === 'doc' || (kind === 'node' && sample.type === 'text')) continue
      const unknown =
        kind === 'mark'
          ? { ...sample, marks: [{ type: 'unknownMark' }] }
          : { ...sample, type: 'unknownNode' }

      // Unknown types fall through to their children, so a handled one renders differently.
      expect(renderRichText(sample), `${kind} ${sample.marks?.[0]?.type ?? sample.type}`).not.toBe(
        renderRichText(unknown)
      )
    }
  })

  it.each(fixture.rejected)('refuses "$name" and leaves the element alone', (rejected) => {
    const { el, rendered } = mount(rejected.document, rejected.config)

    expect(editor).toBeNull()
    expect(el.innerHTML).toBe(rendered)
  })
})

describe('createRichTextEditor', () => {
  it('reports local edits', () => {
    const { el, onChange } = mount(paragraph('Hello'))
    const view = viewOf(el)

    view.dispatch(view.state.tr.insertText('!', 6))

    expect(onChange).toHaveBeenCalledWith(paragraph('Hello!'))
  })

  it('applies outside changes without moving the caret or reporting them', () => {
    const { el, onChange } = mount(paragraph('Hello world'))
    const view = viewOf(el)
    // After "Hello".
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 6)))

    editor?.setDocument(paragraph('Hello world!'))
    expect(view.state.selection.from).toBe(6)

    editor?.setDocument(paragraph('Oh, Hello world!'))
    expect(view.state.selection.from).toBe(10)
    expect(editor?.getDocument()).toEqual(paragraph('Oh, Hello world!'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not report the trailing paragraph Tiptap adds on its own', () => {
    const list: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [paragraph('Point').content![0]!] }],
        },
      ],
    }
    const { el, onChange, rendered } = mount(list)
    const view = viewOf(el)

    expect(view.state.doc.lastChild?.type.name).toBe('paragraph')
    expect(onChange).not.toHaveBeenCalled()

    editor?.destroy()
    editor = null
    expect(el.innerHTML).toBe(rendered)
  })

  it('refuses outside changes the schema cannot hold', () => {
    mount(paragraph('Hello'))

    expect(editor?.setDocument(fixture.rejected[0]!.document)).toBe(false)
    expect(editor?.getDocument()).toEqual(paragraph('Hello'))
  })

  it('leaves the element rendered and its classes intact when destroyed', () => {
    const { el } = mount(paragraph('Hello'))
    editor?.setDocument(paragraph('Hello again'))

    editor?.destroy()
    editor = null

    expect(el.className).toBe('prose')
    expect(el.getAttribute('contenteditable')).toBeNull()
    expect(el.innerHTML).toBe('<p>Hello again</p>')
  })

  it('renders with the latest render options when editing stops', () => {
    const token = { type: 'placeholderToken', attrs: { key: 'name', label: '{name}' } }
    const el = document.createElement('div')
    document.body.appendChild(el)
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [token] }] }
    editor = createRichTextEditor(el, {
      document: doc,
      render: { placeholderHandler: () => 'Old' },
      onChange: vi.fn(),
    })

    editor?.setRender({ placeholderHandler: () => 'New' })
    editor?.destroy()
    editor = null

    expect(el.innerHTML).toBe('<p>New</p>')
  })
})

describe('toolbar', () => {
  function toolbar(): ShadowRoot {
    const root = document.getElementById('b10cks-richtext-toolbar')?.shadowRoot
    if (!root) throw new Error('No toolbar')
    return root
  }

  it('stays visible while the format menu is open, even when the select takes no focus', async () => {
    const { el } = mount(paragraph('Hello'))
    const host = toolbar().host as HTMLElement
    const tick = () => new Promise((resolve) => setTimeout(resolve))
    // The editor takes focus asynchronously when it starts.
    await tick()
    expect(host.hidden).toBe(false)
    const select = toolbar().querySelector('select')!

    select.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
    // Safari leaves focus on the body instead of moving it to the select.
    ;(el as TiptapEditorHTMLElement).editor?.commands.blur()
    await tick()
    expect(host.hidden).toBe(false)

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
    expect(host.hidden).toBe(true)
  })

  it('rejects links with a scheme the render options do not allow', () => {
    const { el, onChange } = mount(paragraph('Hello'))
    const root = toolbar()
    root.querySelector<HTMLButtonElement>('button[aria-label="Link"]')!.click()
    const input = root.querySelector('input')!
    input.value = 'javascript:alert(1)'
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(root.querySelector<HTMLElement>('.error')?.hidden).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(el.querySelector('a')).toBeNull()
  })
})
