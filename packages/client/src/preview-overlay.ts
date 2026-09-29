import {
  type OverlayLayer,
  type OverlayUi,
  type BarModel,
  createOverlayUi,
  LABEL_NOTCH,
} from './overlay-ui'
import { type BlockAction, type BlockMoveEvent, previewBridge } from './preview-bridge'

/**
 * Central controller for editable elements in preview mode. Owns the one
 * selected and one hovered element, intercepts clicks before the site's own
 * handlers run, and draws both highlights with a label in an overlay layer, so
 * nested editables never stack outlines and the site's DOM and CSS stay
 * untouched. A selected block also gets a breadcrumb, quick actions, keyboard
 * navigation, and a drag handle to reorder it.
 */

export interface EditableTarget {
  /** Id of the block the element belongs to. */
  id: string
  /**
   * `block` targets follow editor selection and hover by id. `field` targets
   * share their block's id, so they only react to the pointer.
   */
  kind: 'block' | 'field'
  label?: string
  /** Called on click, instead of the element's native behavior. */
  activate: (click?: MouseEvent) => void
  scrollOnSelect?: boolean
  onSelectChange?: (selected: boolean) => void
  onHoverChange?: (hovered: boolean) => void
}

type Highlight = 'selected' | 'hover'

interface Drop {
  el: HTMLElement
  id: string
  position: BlockMoveEvent['position']
  /** The target sits in a row, so the drop splits it left and right. */
  horizontal: boolean
}

interface Drag {
  id: string
  el: HTMLElement
  drop: Drop | null
}

const HIGHLIGHT_CLASS: Record<Highlight, string> = {
  selected: 'b10cks-selected',
  hover: 'b10cks-hover',
}
const HIDDEN_CLASS = 'b10cks-hidden'

/** Space the box keeps around the element, matching the former outline offset. */
const PAD = 2
/** Below this distance from the viewport top the label moves inside the box. */
const LABEL_SPACE = 24
/** Thickness of the drop indicator line. */
const LINE = 3

const targets = new Map<HTMLElement, EditableTarget>()
const current: Record<Highlight, HTMLElement | null> = { selected: null, hover: null }
/** Block id the editor selected; kept so a re-rendered block picks the selection back up. */
let selectedId: string | null = null
let stop: (() => void) | null = null
let ui: OverlayUi | null = null
let resizeObserver: ResizeObserver | null = null
/** Watches the DOM while something is selected, for moves that don't resize anything. */
let mutationObserver: MutationObserver | null = null
let paintQueued = false
let resolveQueued = false
/** The selection bar is rebuilt on the next paint. */
let barDirty = false
let drag: Drag | null = null

/**
 * Register an element as editable. The controller starts with the first
 * element and stops with the last. Returns the unregister function.
 */
export function registerEditable(el: HTMLElement, target: EditableTarget): () => void {
  targets.set(el, target)
  if (target.kind === 'block') {
    el.classList.toggle(HIDDEN_CLASS, isHidden(target.id) === true)
  }
  if (!stop) {
    stop = start()
  }
  if (target.kind === 'block' && target.id === selectedId) {
    queueResolve()
  }

  return () => {
    if (targets.get(el) !== target) return
    targets.delete(el)
    if (target.kind === 'block') el.classList.remove(HIDDEN_CLASS)
    for (const kind of ['selected', 'hover'] as const) {
      if (current[kind] === el) {
        // Silent: the owning component is going away, so no callbacks.
        current[kind] = null
        el.classList.remove(HIGHLIGHT_CLASS[kind])
      }
    }
    if (targets.size === 0) {
      stop?.()
      stop = null
    } else {
      queueResolve()
    }
  }
}

function start(): () => void {
  selectedId = previewBridge.latest('SELECT_UPDATE')?.selectedItem ?? selectedId
  if (selectedId) queueResolve()
  const offSelect = previewBridge.on('SELECT_UPDATE', ({ selectedItem }) => {
    selectedId = selectedItem || null
    // Picking a field makes the editor select its block (or the root, as no
    // selection); keep the field selected then.
    const field = current.selected && targets.get(current.selected)
    if (field?.kind === 'field' && (!selectedItem || selectedItem === field.id)) return
    highlight('selected', findInnermost(selectedId))
  })
  const offHover = previewBridge.on('HOVER_UPDATE', ({ selectedItem }) => {
    highlight('hover', findInnermost(selectedItem || null))
  })
  const offLabels = previewBridge.on('BLOCK_LABELS', refreshBar)
  const offHidden = previewBridge.on('HIDDEN_BLOCKS', ({ ids }) => {
    const hidden = new Set(ids)
    for (const [el, target] of targets) {
      if (target.kind === 'block') el.classList.toggle(HIDDEN_CLASS, hidden.has(target.id))
    }
    refreshBar()
  })

  const scrollOptions = { capture: true, passive: true }
  window.addEventListener('click', handleClick, true)
  window.addEventListener('auxclick', handleClick, true)
  window.addEventListener('keydown', handleKeydown, true)
  document.addEventListener('pointerover', handlePointerOver, true)
  document.addEventListener('pointerout', handlePointerOut, true)
  window.addEventListener('scroll', schedulePaint, scrollOptions)
  window.addEventListener('resize', schedulePaint)
  resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedulePaint)
  mutationObserver =
    typeof MutationObserver === 'undefined' ? null : new MutationObserver(refreshBar)

  return () => {
    endDrag()
    offSelect()
    offHover()
    offLabels()
    offHidden()
    window.removeEventListener('click', handleClick, true)
    window.removeEventListener('auxclick', handleClick, true)
    window.removeEventListener('keydown', handleKeydown, true)
    document.removeEventListener('pointerover', handlePointerOver, true)
    document.removeEventListener('pointerout', handlePointerOut, true)
    window.removeEventListener('scroll', schedulePaint, scrollOptions)
    window.removeEventListener('resize', schedulePaint)
    resizeObserver?.disconnect()
    resizeObserver = null
    mutationObserver?.disconnect()
    mutationObserver = null
    current.selected = null
    current.hover = null
    ui?.host.remove()
    ui = null
  }
}

/**
 * Runs in the capture phase on window, before any listener on the page: the
 * click selects the innermost editable and never reaches links, buttons, or
 * router handlers inside it.
 */
function handleClick(event: MouseEvent) {
  // Alt/Option-click reaches the page, so editors can open tabs, menus, or carousels.
  if (event.altKey) return
  const el = closestTarget(event)
  if (!el) return

  consume(event)
  if (event.type === 'click') select(el, event)
}

/**
 * With a selection and focus outside form fields: Escape selects the parent
 * block, ArrowUp and ArrowDown the previous and next sibling block. During a
 * drag, Escape cancels it.
 */
function handleKeydown(event: KeyboardEvent) {
  if (drag) {
    if (event.key === 'Escape') {
      consume(event)
      endDrag()
    }
    return
  }

  const el = current.selected
  if (!el?.isConnected || event.defaultPrevented || isTyping(event)) return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

  let next: HTMLElement | null = null
  if (event.key === 'Escape') next = ancestorBlocks(el)[0] ?? null
  else if (event.key === 'ArrowUp') next = siblingBlock(el, -1)
  else if (event.key === 'ArrowDown') next = siblingBlock(el, 1)
  if (!next) return

  consume(event)
  select(next)
}

function isTyping(event: Event): boolean {
  const origin = event.composedPath()[0]
  return (
    origin instanceof HTMLElement &&
    (origin.isContentEditable || origin.matches('input, textarea, select'))
  )
}

function consume(event: Event) {
  event.preventDefault()
  event.stopImmediatePropagation()
}

/** Select like a click does: tell the editor and highlight right away. */
function select(el: HTMLElement, click?: MouseEvent) {
  const target = targets.get(el)
  if (!target) return
  target.activate(click)
  if (target.kind === 'block') {
    selectedId = target.id
  }
  highlight('selected', el)
}

/** Select the innermost element of block `id`, as if it was clicked. */
export function selectBlock(id: string) {
  const el = findInnermost(id)
  if (el) select(el)
}

function runAction(action: BlockAction) {
  const target = current.selected && targets.get(current.selected)
  if (target?.kind === 'block') {
    previewBridge.blockAction(target.id, action)
  }
}

function handlePointerOver(event: PointerEvent) {
  highlight('hover', closestTarget(event))
}

function handlePointerOut(event: PointerEvent) {
  if (!event.relatedTarget) {
    highlight('hover', null)
  }
}

/** The innermost registered element on the event path. */
function closestTarget(event: Event): HTMLElement | null {
  for (const node of event.composedPath()) {
    if (node instanceof HTMLElement && targets.has(node)) return node
  }
  return null
}

/** The innermost connected block element for `id`, when a block renders several. */
function findInnermost(id: string | null): HTMLElement | null {
  if (!id) return null
  let found: HTMLElement | null = null
  for (const [el, target] of targets) {
    if (target.kind !== 'block' || target.id !== id || !el.isConnected) continue
    if (!found || found.contains(el)) found = el
  }
  return found
}

/** The parent element, stepping out of shadow roots. */
function parentOf(el: Element): Element | null {
  if (el.parentElement) return el.parentElement
  const root = el.parentNode
  return root instanceof ShadowRoot ? root.host : null
}

/**
 * Block elements around `el`, innermost first, one per block: a block that
 * renders nested elements of its own appears once, and never for itself.
 */
function ancestorBlocks(el: HTMLElement): HTMLElement[] {
  const found: HTMLElement[] = []
  const own = targets.get(el)
  let lastId = own?.kind === 'block' ? own.id : null
  for (let node = parentOf(el); node; node = parentOf(node)) {
    if (!(node instanceof HTMLElement)) continue
    const target = targets.get(node)
    if (target?.kind !== 'block' || target.id === lastId) continue
    found.push(node)
    lastId = target.id
  }
  return found
}

function parentBlockId(el: HTMLElement): string | null {
  const parent = ancestorBlocks(el)[0]
  return (parent && targets.get(parent)?.id) ?? null
}

/**
 * The previous or next block in document order that shares the parent block
 * of `el`. Siblings the page renders without an editable are invisible here.
 */
function siblingBlock(el: HTMLElement, direction: -1 | 1): HTMLElement | null {
  const own = targets.get(el)
  if (own?.kind !== 'block') return null
  const parentId = parentBlockId(el)
  const wanted =
    direction === 1 ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING

  let best: HTMLElement | null = null
  for (const [candidate, target] of targets) {
    if (target.kind !== 'block' || target.id === own.id || !candidate.isConnected) continue
    if (!(el.compareDocumentPosition(candidate) & wanted)) continue
    // Closer than the best so far: the best lies beyond the candidate.
    if (best && !(candidate.compareDocumentPosition(best) & wanted)) continue
    if (parentBlockId(candidate) !== parentId) continue
    best = candidate
  }
  return best && findInnermost(targets.get(best)?.id ?? null)
}

function barModel(el: HTMLElement): BarModel | null {
  const target = targets.get(el)
  if (!target) return null
  const crumbs = ancestorBlocks(el)
    .reverse()
    .flatMap((ancestor) => {
      const crumb = targets.get(ancestor)
      return crumb ? [{ id: crumb.id, label: labelFor(crumb) || 'Block' }] : []
    })
  return {
    label: labelFor(target),
    crumbs,
    actions:
      target.kind === 'block'
        ? {
            canMoveUp: !!siblingBlock(el, -1),
            canMoveDown: !!siblingBlock(el, 1),
            hidden: isHidden(target.id),
          }
        : null,
  }
}

function startDrag(event: PointerEvent, handle: HTMLElement) {
  const el = current.selected
  const target = el && targets.get(el)
  if (!el || target?.kind !== 'block' || event.button !== 0) return

  // No text selection or compatibility mouse events while dragging.
  event.preventDefault()
  // Keep receiving the pointer when it leaves the preview frame.
  if (event.isTrusted) handle.setPointerCapture(event.pointerId)
  drag = { id: target.id, el, drop: null }
  ui?.setDragging(true)
  window.addEventListener('pointermove', handleDragMove, true)
  window.addEventListener('pointerup', handleDrop, true)
  window.addEventListener('pointercancel', endDrag, true)
}

function handleDragMove(event: PointerEvent) {
  if (!drag) return
  drag.drop = dropTarget(drag, event.clientX, event.clientY)
  highlight('hover', drag.drop?.el ?? null)
  schedulePaint()
}

function handleDrop(event: PointerEvent) {
  const moving = drag
  const drop = moving && dropTarget(moving, event.clientX, event.clientY)
  endDrag()
  if (moving && drop) {
    previewBridge.moveBlock(moving.id, drop.id, drop.position)
  }
}

function endDrag() {
  if (!drag) return
  drag = null
  window.removeEventListener('pointermove', handleDragMove, true)
  window.removeEventListener('pointerup', handleDrop, true)
  window.removeEventListener('pointercancel', endDrag, true)
  ui?.setDragging(false)
  highlight('hover', null)
  schedulePaint()
}

/**
 * The innermost block under the point, with the side to drop on. Null over
 * anything that isn't a block, over the dragged block or its descendants, and
 * over its ancestors, where only the gaps between their children are hit.
 */
function dropTarget(moving: Drag, x: number, y: number): Drop | null {
  const hit = document.elementsFromPoint(x, y).find((el) => el !== ui?.host)
  let found: HTMLElement | null = null
  for (let node = hit ?? null; node; node = parentOf(node)) {
    if (!(node instanceof HTMLElement)) continue
    const target = targets.get(node)
    if (target?.kind !== 'block') continue
    if (target.id === moving.id) return null
    found ??= node
  }

  const target = found && targets.get(found)
  if (!found || !target || found.contains(moving.el)) return null
  const rect = found.getBoundingClientRect()
  const horizontal = moving.drop?.el === found ? moving.drop.horizontal : isRow(found, rect)
  const before = horizontal ? x < rect.left + rect.width / 2 : y < rect.top + rect.height / 2
  return { el: found, id: target.id, position: before ? 'before' : 'after', horizontal }
}

/** Whether `el` sits side by side with a sibling block, like cards in a grid. */
function isRow(el: HTMLElement, rect: DOMRect): boolean {
  const neighbor = siblingBlock(el, 1) ?? siblingBlock(el, -1)
  if (!neighbor) return false
  const other = neighbor.getBoundingClientRect()
  return other.top < rect.bottom && other.bottom > rect.top
}

/** Re-resolve the selection after elements mount or unmount, batched per tick. */
function queueResolve() {
  if (resolveQueued) return
  resolveQueued = true
  queueMicrotask(() => {
    resolveQueued = false
    const selected = current.selected
    // A selected field stays selected; blocks follow the editor's selected id.
    if (selected?.isConnected && targets.get(selected)?.kind === 'field') return
    highlight('selected', findInnermost(selectedId))
  })
}

function highlight(kind: Highlight, el: HTMLElement | null) {
  const prev = current[kind]
  if (prev === el) return
  current[kind] = el

  if (prev) {
    prev.classList.remove(HIGHLIGHT_CLASS[kind])
    notify(prev, kind, false)
  }
  if (el) {
    el.classList.add(HIGHLIGHT_CLASS[kind])
    notify(el, kind, true)
    if (kind === 'selected' && targets.get(el)?.scrollOnSelect) {
      el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
    }
  }

  if (resizeObserver) {
    resizeObserver.disconnect()
    // The document box catches layout shifts that move the element without resizing it.
    resizeObserver.observe(document.documentElement)
    if (current.selected) resizeObserver.observe(current.selected)
    if (current.hover) resizeObserver.observe(current.hover)
  }
  if (kind === 'selected') {
    mutationObserver?.disconnect()
    if (el) mutationObserver?.observe(document.body, { childList: true, subtree: true })
    barDirty = true
  }
  schedulePaint()
}

function notify(el: HTMLElement, kind: Highlight, active: boolean) {
  const target = targets.get(el)
  if (kind === 'selected') target?.onSelectChange?.(active)
  else target?.onHoverChange?.(active)
}

function refreshBar() {
  barDirty = true
  schedulePaint()
}

function schedulePaint() {
  if (paintQueued) return
  paintQueued = true
  requestAnimationFrame(() => {
    paintQueued = false
    paint()
  })
}

function paint() {
  if (!stop) return
  const { selected } = current
  // The selection box already marks the element; a second box would only add noise.
  const hover = current.hover === selected ? null : current.hover
  if (!ui && !selected && !hover) return

  ui ??= createOverlayUi({ onAction: runAction, onSelect: selectBlock, onDragStart: startDrag })
  if (barDirty) {
    barDirty = false
    ui.renderBar(selected?.isConnected ? barModel(selected) : null)
  }
  const hoverLabel = labelFor(hover ? targets.get(hover) : undefined)
  if (ui.hover.name.textContent !== hoverLabel) ui.hover.name.textContent = hoverLabel

  drawBox(ui.selected, selected)
  drawBox(ui.hover, hover)
  drawIndicator(ui.indicator, drag?.drop ?? null)
}

function drawBox(layer: OverlayLayer, el: HTMLElement | null) {
  if (!el?.isConnected) {
    layer.box.hidden = true
    return
  }

  const { box, label } = layer
  const rect = el.getBoundingClientRect()
  const labelWidth = label.offsetWidth
  const labelHeight = label.offsetHeight
  const viewportWidth = document.documentElement.clientWidth

  box.hidden = false
  box.style.transform = `translate(${rect.left - PAD}px, ${rect.top - PAD}px)`
  box.style.width = `${rect.width + PAD * 2}px`
  box.style.height = `${rect.height + PAD * 2}px`

  // Near the viewport top the label moves inside the box, and stays in view
  // while the top of a tall element is scrolled away.
  const inside = rect.top < LABEL_SPACE
  box.toggleAttribute('data-inside', inside)
  const top = Math.min(PAD - rect.top, rect.height + PAD * 2 - labelHeight)
  label.style.top = inside ? `${Math.max(0, top)}px` : ''
  // Shift the label left rather than let it run off the right edge.
  const labelLeft = rect.left - PAD + LABEL_NOTCH
  const overflow = labelLeft + labelWidth - viewportWidth
  label.style.marginLeft = overflow > 0 ? `${-Math.min(overflow, labelLeft)}px` : ''
}

function drawIndicator(line: HTMLElement, drop: Drop | null) {
  if (!drop?.el.isConnected) {
    line.hidden = true
    return
  }

  const rect = drop.el.getBoundingClientRect()
  const before = drop.position === 'before'
  const { style } = line
  line.hidden = false
  if (drop.horizontal) {
    const x = before ? rect.left : rect.right
    style.transform = `translate(${x - LINE / 2}px, ${rect.top}px)`
    style.width = `${LINE}px`
    style.height = `${rect.height}px`
  } else {
    const y = before ? rect.top : rect.bottom
    style.transform = `translate(${rect.left}px, ${y - LINE / 2}px)`
    style.width = `${rect.width}px`
    style.height = `${LINE}px`
  }
}

/**
 * Whether the editor hides block `id`. Null until the editor sent
 * HIDDEN_BLOCKS: older editors don't, and can't hide from the preview.
 */
function isHidden(id: string): boolean | null {
  return previewBridge.latest('HIDDEN_BLOCKS')?.ids.includes(id) ?? null
}

/** Blocks use the editor's display name for their slug when it sent one. */
function labelFor(target: EditableTarget | undefined): string {
  const label = target?.label
  if (!label) return ''
  const displayName =
    target.kind === 'block' ? previewBridge.latest('BLOCK_LABELS')?.labels[label] : undefined
  return displayName ?? formatLabel(label)
}

/**
 * Show a slug like `hero_section` as `Hero section`. Anything else is taken to
 * be a deliberate label and kept verbatim.
 */
function formatLabel(label: string | undefined): string {
  if (!label) return ''
  if (!/^[a-z][a-z0-9]*([_-][a-z0-9]+)*$/.test(label)) return label
  const words = label.replace(/[_-]+/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
