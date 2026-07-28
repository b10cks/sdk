import type { FieldPath, SelectUpdateEvent } from './preview-bridge'
import { previewBridge } from './preview-bridge'

const STYLE_ID = 'b10cks-preview-style'
const SCROLL_OFFSET_VAR = '--b10cks-scroll-offset'

/**
 * Inject the preview outline styles once. Selected/hovered blocks get an
 * outline; `.b10cks-preview` carries a `scroll-margin-top` so scroll-into-view
 * clears a fixed app header. Set the offset via {@link setPreviewScrollOffset}
 * or the `--b10cks-scroll-offset` CSS variable.
 */
export function ensurePreviewStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return
  }

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .b10cks-preview { scroll-margin-top: var(${SCROLL_OFFSET_VAR}, 0px); }
    .b10cks-hover,
    .b10cks-preview:hover {
      outline: 2px dashed rgba(59, 130, 246, 0.5);
      outline-offset: 2px;
    }
    .b10cks-selected {
      outline: 2px solid rgb(59, 130, 246) !important;
      outline-offset: 2px;
    }
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
  onSelectChange?: (selected: boolean) => void
  onHoverChange?: (hovered: boolean) => void
  /** Scroll the element into view when it becomes selected. Default true. */
  scrollOnSelect?: boolean
}

/**
 * Wire a DOM element as a selectable block: click selects it in the editor,
 * and editor-driven select/hover toggle outline classes. Honors the configured
 * scroll offset and only scrolls when the element isn't already in view.
 * Returns a cleanup function. No-op outside preview mode.
 */
export function attachEditable(el: HTMLElement, options: AttachEditableOptions): () => void {
  if (!previewBridge.isInPreviewMode() || !options.id) {
    return () => {}
  }

  ensurePreviewStyles()
  const { id, onSelectChange, onHoverChange, scrollOnSelect = true } = options

  el.classList.add('b10cks-preview')

  const handleClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    previewBridge.selectItem(id)
  }

  const handleSelect = ({ selectedItem }: SelectUpdateEvent) => {
    const selected = selectedItem === id
    el.classList.toggle('b10cks-selected', selected)
    if (selected && scrollOnSelect) {
      scrollIntoViewIfNeeded(el)
    }
    onSelectChange?.(selected)
  }

  const handleHover = ({ selectedItem }: SelectUpdateEvent) => {
    const hovered = selectedItem === id
    el.classList.toggle('b10cks-hover', hovered)
    onHoverChange?.(hovered)
  }

  el.addEventListener('click', handleClick)
  const offSelect = previewBridge.on('SELECT_UPDATE', handleSelect)
  const offHover = previewBridge.on('HOVER_UPDATE', handleHover)

  return () => {
    el.removeEventListener('click', handleClick)
    offSelect()
    offHover()
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
   * is the right choice for rich text and other complex types. Default
   * `inline`, or `select` automatically when no `field` is given but a `path`
   * targets a complex value.
   */
  mode?: EditableFieldMode
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

  const { id, field, path, mode = 'inline' } = options

  if (mode === 'select') {
    ensurePreviewStyles()
    el.classList.add('b10cks-preview')

    const handleClick = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (path) {
        previewBridge.selectField(id, path)
      } else {
        previewBridge.selectItem(id)
      }
    }

    el.addEventListener('click', handleClick)
    return () => {
      el.removeEventListener('click', handleClick)
      el.classList.remove('b10cks-preview')
    }
  }

  el.setAttribute('contenteditable', 'true')

  const handleInput = (event: Event) => {
    const value = (event.target as HTMLElement).innerText
    if (path) {
      previewBridge.updateFieldAt(id, path, value)
    } else {
      previewBridge.updateField(id, field ?? '', value)
    }
  }

  el.addEventListener('input', handleInput)
  return () => {
    el.removeEventListener('input', handleInput)
    el.removeAttribute('contenteditable')
  }
}

function scrollIntoViewIfNeeded(el: HTMLElement): void {
  if (typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
}
