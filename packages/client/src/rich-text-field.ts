import type { RichTextDocument, RichTextFieldConfig, RichTextHtmlOptions } from '@b10cks/richtext'
import type { RichTextEditor } from '@b10cks/richtext/editor'

import { ensurePreviewStyles } from './editable'
import { type FieldPath, previewBridge } from './preview-bridge'
import { registerEditable, selectBlock } from './preview-overlay'

export interface AttachRichTextFieldOptions {
  /** Id of the block the field belongs to. */
  id: string
  /** Path to the field within the block. */
  path: FieldPath
  /** The field's document, as rendered into the element. */
  document: RichTextDocument | null | undefined
  /** Shown on the field's highlight. Defaults to the field name. */
  label?: string
  /** The options the element was rendered with, so links and placeholders look the same while editing. */
  render?: RichTextHtmlOptions
  /**
   * Editing started or stopped. While it runs the editor owns the element's
   * content, so keep rendering the HTML you rendered before it started.
   */
  onEditingChange?: (editing: boolean) => void
}

/** The field a rich text component renders, for its `editable` prop. */
export type EditableRichTextField = Pick<AttachRichTextFieldOptions, 'id' | 'path' | 'label'>

export interface RichTextFieldHandle {
  /** Pass the field's latest document whenever it changes. */
  update: (document: RichTextDocument | null | undefined) => void
  destroy: () => void
}

/** Edits reach the editor at most this often while typing, and on blur. */
const SEND_INTERVAL_MS = 300
/** How long to wait for the editor's FIELD_CONFIG before leaving the field to it. */
const CONFIG_TIMEOUT_MS = 2000

const EMPTY_DOCUMENT: RichTextDocument = { type: 'doc', content: [] }

let editorModule: Promise<typeof import('@b10cks/richtext/editor') | null> | null = null

/** Tiptap is loaded on first use, and only ever in preview mode. */
function loadEditor() {
  editorModule ??= import('@b10cks/richtext/editor').catch(() => {
    editorModule = null
    return null
  })
  return editorModule
}

/**
 * Make a rendered rich text field editable in place in the preview. A click
 * selects the field in the editor, which answers with the field's settings
 * when the user may edit it; the element then turns into a Tiptap editor with
 * the CMS schema. Edits stream to the editor as FIELD_UPDATE, and changes made
 * in the editor arrive through {@link RichTextFieldHandle.update} without
 * moving the caret. Escape returns to block selection.
 *
 * Without the editor's go-ahead (older editors, read-only users) the field
 * behaves like `attachEditableField` in `select` mode. No-op outside preview
 * mode, where Tiptap is never loaded.
 */
export function attachRichTextField(
  el: HTMLElement,
  options: AttachRichTextFieldOptions
): RichTextFieldHandle {
  if (!previewBridge.isInPreviewMode() || !options.id) {
    return { update() {}, destroy() {} }
  }

  ensurePreviewStyles()
  const { id, path, render, onEditingChange } = options
  let document = options.document ?? EMPTY_DOCUMENT
  let editor: RichTextEditor | null = null
  /** Bumped on every start and stop, so a start still loading can tell it's stale. */
  let session = 0
  /** The last document both sides agree on: sent from here or applied from the editor. */
  let synced = document
  let pending: RichTextDocument | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  const send = () => {
    clearTimeout(timer)
    timer = undefined
    const value = pending
    pending = null
    if (!value || isSameJson(value, synced)) return
    synced = value
    document = value
    previewBridge.updateFieldAt(id, path, value)
    previewBridge.patchLocal({ itemId: id, path, value })
  }

  const queue = (next: RichTextDocument) => {
    pending = next
    timer ??= setTimeout(send, SEND_INTERVAL_MS)
  }

  const stop = () => {
    session++
    if (!editor) return
    send()
    editor.destroy()
    editor = null
    onEditingChange?.(false)
  }

  const start = async (click?: MouseEvent) => {
    if (editor) return
    const current = ++session
    const config = waitForConfig(id, path)
    previewBridge.selectField(id, path)
    const [module, richtext] = await Promise.all([loadEditor(), config])
    if (current !== session || !module || !richtext || !el.isConnected) return

    editor = module.createRichTextEditor(el, {
      document,
      config: richtext,
      render,
      at: click && { x: click.clientX, y: click.clientY },
      onChange: queue,
      onBlur: send,
      onExit: () => {
        stop()
        selectBlock(id)
      },
    })
    if (!editor) return
    synced = document
    onEditingChange?.(true)
  }

  el.classList.add('b10cks-preview')
  const unregister = registerEditable(el, {
    id,
    kind: 'field',
    label: options.label ?? path.findLast((segment) => typeof segment === 'string'),
    activate: (click) => void start(click),
    isEditing: () => editor !== null,
    onSelectChange: (selected) => {
      if (!selected) stop()
    },
    // Warm up on hover, so editing starts without a wait on click.
    onHoverChange: (hovered) => {
      if (hovered) void loadEditor()
    },
  })

  return {
    update(next) {
      const incoming = next ?? EMPTY_DOCUMENT
      if (!editor) {
        document = synced = incoming
        return
      }
      // Our own edit coming back, or an older copy of it.
      if (isSameJson(incoming, synced)) return
      if (!editor.setDocument(incoming)) {
        stop()
        return
      }
      document = synced = incoming
      // Unsent typing now sits on top of the incoming document.
      if (pending) pending = editor.getDocument()
    },
    destroy() {
      stop()
      unregister()
      el.classList.remove('b10cks-preview', 'b10cks-selected', 'b10cks-hover')
    },
  }
}

/** The editor's FIELD_CONFIG for the field, or null when it doesn't send one in time. */
function waitForConfig(id: string, path: FieldPath): Promise<RichTextFieldConfig | null> {
  return new Promise((resolve) => {
    const finish = (config: RichTextFieldConfig | null) => {
      off()
      clearTimeout(timeout)
      resolve(config)
    }
    const off = previewBridge.on('FIELD_CONFIG', (event) => {
      if (event.itemId === id && isSameJson(event.path, path)) finish(event.richtext)
    })
    const timeout = setTimeout(() => finish(null), CONFIG_TIMEOUT_MS)
  })
}

/** Deep equality of JSON values, ignoring key order. */
function isSameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false

  const aEntries = Object.entries(a)
  const bRecord: Record<string, unknown> = { ...b }
  return (
    aEntries.length === Object.keys(bRecord).length &&
    aEntries.every(([key, value]) => key in bRecord && isSameJson(value, bRecord[key]))
  )
}
