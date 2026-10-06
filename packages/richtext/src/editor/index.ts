import { Editor, Extension, getSchema } from '@tiptap/core'
import type { Fragment, Node as ProseMirrorNode, Schema } from '@tiptap/pm/model'

import {
  type RichTextDocument,
  type RichTextFieldConfig,
  type RichTextHtmlOptions,
  renderRichText,
} from '../index'
import { createRichTextExtensions } from './extensions'
import { transformPastedHtml } from './paste'
import { createToolbar, type Toolbar } from './toolbar'

/**
 * In-place rich text editing for the live preview, with the same schema as the
 * CMS editor. Pulls in Tiptap, so load it with a dynamic `import()` from
 * preview-only code; `@b10cks/client` does that for you.
 */

export { createRichTextExtensions, isFeatureEnabled } from './extensions'

export interface RichTextEditorOptions {
  document: RichTextDocument
  config?: RichTextFieldConfig
  /** Link and placeholder rendering, as passed to `renderRichText`. */
  render?: RichTextHtmlOptions
  /** Viewport point to put the caret at, usually the click that started editing. */
  at?: { x: number; y: number }
  onChange: (document: RichTextDocument) => void
  onBlur?: () => void
  /** Escape was pressed. */
  onExit?: () => void
}

export interface RichTextEditor {
  getDocument: () => RichTextDocument
  /**
   * Apply a change made elsewhere. Only the changed range is replaced, so the
   * caret stays put. Returns false when the schema can't hold the document.
   */
  setDocument: (document: RichTextDocument) => boolean
  /**
   * Use new render options, e.g. after the page changed its link handler. Links and placeholders
   * use them from their next render, and so does the HTML left behind by `destroy`.
   */
  setRender: (render: RichTextHtmlOptions) => void
  /** Stop editing. The element is left showing the rendered document. */
  destroy: () => void
}

/** Marks transactions that apply outside changes, so they aren't reported back. */
const REMOTE = 'b10cksRemote'

/**
 * Turn `el`, which shows the rendered document, into its editor. Returns null
 * when the document holds content the field's schema doesn't know, which the
 * editor would otherwise drop; leave such fields to the CMS.
 */
export function createRichTextEditor(
  el: HTMLElement,
  options: RichTextEditorOptions
): RichTextEditor | null {
  const { config = {} } = options
  // One object for the editor's lifetime: extensions read it when they render.
  const render: RichTextHtmlOptions = { ...options.render }
  let toolbar: Toolbar | null = null
  const shortcuts = Extension.create({
    name: 'b10cksPreviewShortcuts',
    addKeyboardShortcuts: () => ({
      Escape: () => {
        options.onExit?.()
        return true
      },
      'Mod-k': () => {
        toolbar?.openLink()
        return true
      },
    }),
  })
  const extensions = [...createRichTextExtensions(config, render), shortcuts]
  if (!parse(getSchema(extensions), options.document)) return null

  const className = el.getAttribute('class')
  // The document the CMS holds, as last sent or received. An update matching
  // it (e.g. only the trailing paragraph Tiptap adds on the first click) is not
  // an edit, so it is neither reported nor able to mark content dirty.
  let known: ProseMirrorNode | null = null
  const editor = new Editor({
    element: { mount: el },
    extensions,
    content: options.document,
    editorProps: { transformPastedHTML: transformPastedHtml },
    onUpdate: ({ editor: current, transaction }) => {
      if (transaction.getMeta(REMOTE)) return
      known ??= parse(current.schema, options.document)
      if (known && isSameContent(current.state.doc, known)) return
      known = current.state.doc
      options.onChange(toDocument(known))
    },
    onBlur: () => options.onBlur?.(),
  })
  toolbar = createToolbar(editor, el, config, render)

  const caret = options.at && editor.view.posAtCoords({ left: options.at.x, top: options.at.y })
  editor.commands.focus(caret ? caret.pos : 'end')

  return {
    getDocument: () => toDocument(editor.state.doc),
    setDocument(document) {
      const next = parse(editor.schema, document)
      if (!next) return false
      known = next
      const { state } = editor
      const start = state.doc.content.findDiffStart(next.content)
      const end = state.doc.content.findDiffEnd(next.content)
      if (start == null || !end) return true

      // Where the changed ranges overlap (e.g. a repeated character), widen both.
      let { a: endA, b: endB } = end
      const overlap = start - Math.min(endA, endB)
      if (overlap > 0) {
        endA += overlap
        endB += overlap
      }
      const tr = state.tr.replace(start, endA, next.slice(start, endB))
      editor.view.dispatch(tr.setMeta('addToHistory', false).setMeta(REMOTE, true))
      return true
    },
    setRender(next) {
      for (const key of Object.keys(render) as (keyof RichTextHtmlOptions)[]) delete render[key]
      Object.assign(render, next)
    },
    destroy() {
      // Unchanged content renders as it came in, without the trailing paragraph.
      const current = editor.state.doc
      const document =
        known && isSameContent(current, known) ? toDocument(known) : toDocument(current)
      toolbar?.destroy()
      editor.destroy()
      if (className === null) el.removeAttribute('class')
      else el.setAttribute('class', className)
      el.innerHTML = renderRichText(document, render)
    },
  }
}

/**
 * Whether two documents hold the same content, not counting an empty paragraph
 * at the end, which Tiptap's trailing node adds after a closing list, heading,
 * or table. Mirrors `isSameContent` in the CMS editor.
 */
function isSameContent(a: ProseMirrorNode, b: ProseMirrorNode): boolean {
  return withoutTrailingParagraph(a).eq(withoutTrailingParagraph(b))
}

function withoutTrailingParagraph(doc: ProseMirrorNode): Fragment {
  const last = doc.lastChild
  if (doc.childCount < 2 || last?.type.name !== 'paragraph' || last.content.size > 0) {
    return doc.content
  }
  return doc.content.cut(0, doc.content.size - last.nodeSize)
}

/** ProseMirror's JSON form of a document node is the stored rich text format. */
function toDocument(node: ProseMirrorNode): RichTextDocument {
  return node.toJSON()
}

/** The document as a node of `schema`, or null when it doesn't fit. */
function parse(schema: Schema, document: RichTextDocument): ProseMirrorNode | null {
  try {
    const node = schema.nodeFromJSON(document)
    node.check()
    return node
  } catch {
    return null
  }
}
