import type { FieldPath } from './preview-bridge'
import { previewBridge } from './preview-bridge'
import { registerEditable } from './preview-overlay'

const STYLE_ID = 'b10cks-preview-style'
const SCROLL_OFFSET_VAR = '--b10cks-scroll-offset'

/**
 * Inject the preview styles once: `.b10cks-preview` carries a
 * `scroll-margin-top` so scroll-into-view clears a fixed app header. Set the
 * offset via {@link setPreviewScrollOffset} or the `--b10cks-scroll-offset`
 * CSS variable. Blocks the editor hides carry `b10cks-hidden` and are dimmed.
 * Selection and hover are drawn in a separate overlay layer.
 */
export function ensurePreviewStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return
  }

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .b10cks-preview { scroll-margin-top: var(${SCROLL_OFFSET_VAR}, 0px); }
    .b10cks-preview.b10cks-hidden { opacity: 0.4 !important; }
  `
  document.head.appendChild(style)
}

/**
 * Set the scroll offset used when a selected block is scrolled into view.
 * Pass your fixed header's height so selection no longer overshoots beneath it.
 * A number is treated as pixels; strings are used verbatim (e.g. `"5rem"`).
 */
export function setPreviewScrollOffset(offset: number | string): void {
  if (typeof document === 'undefined') {
    return
  }
  const value = typeof offset === 'number' ? `${offset}px` : offset
  document.documentElement.style.setProperty(SCROLL_OFFSET_VAR, value)
}

export interface AttachEditableOptions {
  id: string
  /** Shown on the selection and hover label. A slug like `hero_section` reads as `Hero section`. */
  label?: string
  onSelectChange?: (selected: boolean) => void
  onHoverChange?: (hovered: boolean) => void
  /** Scroll the element into view when it becomes selected. Default true. */
  scrollOnSelect?: boolean
  /**
   * Let clicks inside the element reach the page after selecting it, for
   * components like accordions, tabs or carousels. Links and form submit
   * buttons still don't navigate. Default false: a click only selects.
   */
  interactive?: boolean
}

/**
 * Wire a DOM element as a selectable block. A click selects it in the editor
 * and, unless `interactive` is set, never reaches links or buttons inside it.
 * Only the innermost editable
 * under the pointer or matching the editor's selection is highlighted, with a
 * label. Toggles `b10cks-selected`, `b10cks-hover`, and `b10cks-hidden` (while
 * the editor hides the block) on the element. Returns a
 * cleanup function. No-op outside preview mode.
 */
export function attachEditable(el: HTMLElement, options: AttachEditableOptions): () => void {
  if (!previewBridge.isInPreviewMode() || !options.id) {
    return () => {}
  }

  ensurePreviewStyles()
  const { id, label, onSelectChange, onHoverChange, scrollOnSelect = true, interactive } = options

  el.classList.add('b10cks-preview')
  const unregister = registerEditable(el, {
    id,
    kind: 'block',
    label,
    scrollOnSelect,
    interactive,
    onSelectChange,
    onHoverChange,
    activate: () => previewBridge.selectItem(id),
  })

  return () => {
    unregister()
    el.classList.remove('b10cks-preview', 'b10cks-selected', 'b10cks-hover')
  }
}

export type EditableFieldMode = 'inline' | 'select'

export interface AttachEditableFieldOptions {
  id: string
  /** @deprecated Use `path`. Kept for flat string fields. */
  field?: string
  path?: FieldPath
  /**
   * `inline` makes the element contenteditable and streams plain-text edits
   * back to the editor — suitable for simple string fields only. `select`
   * instead deep-selects the field so the editor opens its own editor, which
   * is the right choice for rich text and other complex types. Defaults to
   * `select` for path-only fields and fields wrapping interactive children;
   * other flat fields default to `inline`.
   */
  mode?: EditableFieldMode
  /** Label for `select` mode. Defaults to the field name. */
  label?: string
}

/**
 * Wire a DOM element for field editing. Returns a cleanup function. No-op
 * outside preview mode. See {@link AttachEditableFieldOptions.mode}.
 */
export function attachEditableField(
  el: HTMLElement,
  options: AttachEditableFieldOptions
): () => void {
  if (!previewBridge.isInPreviewMode() || !options.id) {
    return () => {}
  }

  const { id, field, path, label } = options
  const mode =
    options.mode ??
    (field && !el.querySelector('a, button, input, select, textarea') ? 'inline' : 'select')

  if (mode === 'select') {
    ensurePreviewStyles()
    el.classList.add('b10cks-preview')
    const fieldPath = path ?? (field ? [field] : undefined)

    const unregister = registerEditable(el, {
      id,
      kind: 'field',
      label: label ?? fieldName(path) ?? field,
      activate: () =>
        fieldPath ? previewBridge.selectField(id, fieldPath) : previewBridge.selectItem(id),
    })

    return () => {
      unregister()
      el.classList.remove('b10cks-preview', 'b10cks-selected', 'b10cks-hover')
    }
  }

  el.setAttribute('contenteditable', 'true')

  const handleClick = (event: MouseEvent) => {
    // A field inside a selectable link must still receive focus and a caret.
    // Stop the link's click while leaving the pointerdown focus intact.
    event.preventDefault()
    event.stopPropagation()
    el.focus()
  }

  const handleInput = (event: Event) => {
    const value = (event.target as HTMLElement).innerText
    if (path) {
      previewBridge.updateFieldAt(id, path, value)
    } else {
      previewBridge.updateField(id, field ?? '', value)
    }
  }

  el.addEventListener('input', handleInput)
  el.addEventListener('click', handleClick)
  return () => {
    el.removeEventListener('input', handleInput)
    el.removeEventListener('click', handleClick)
    el.removeAttribute('contenteditable')
  }
}

/** The last named segment of a path, e.g. `body` for `['body', 2]`. */
function fieldName(path: FieldPath | undefined): string | undefined {
  return path?.findLast((segment): segment is string => typeof segment === 'string')
}
