import type { BlockAction } from './preview-bridge'

/**
 * The overlay's DOM: selection and hover boxes with labels, the selection bar
 * (breadcrumb and block actions), and the drop indicator, all in one shadow
 * root so page styles never reach them. The controller in `preview-overlay`
 * owns state and positioning; this module only builds and updates elements.
 */

export interface OverlayLayer {
  box: HTMLElement
  label: HTMLElement
  /** The element holding the target's own label text. */
  name: HTMLElement
}

export interface Crumb {
  id: string
  label: string
}

export interface BarModel {
  label: string
  /** Ancestor blocks, outermost first. */
  crumbs: Crumb[]
  /** Toolbar state. Null for fields, which get no toolbar. */
  actions: {
    canMoveUp: boolean
    canMoveDown: boolean
    /** Null hides the visibility toggle, for editors that can't hide blocks. */
    hidden: boolean | null
  } | null
}

export interface OverlayHandlers {
  onAction: (action: BlockAction) => void
  onSelect: (id: string) => void
  onDragStart: (event: PointerEvent, handle: HTMLElement) => void
}

export interface OverlayUi {
  host: HTMLElement
  selected: OverlayLayer
  hover: OverlayLayer
  indicator: HTMLElement
  renderBar: (model: BarModel | null) => void
  setDragging: (dragging: boolean) => void
}

/** Ancestors shown in the breadcrumb before older ones collapse into `…`. */
const MAX_CRUMBS = 3

const BLUE = 'rgb(59, 130, 246)'
/** Distance of the label from the box's outer left edge. */
export const LABEL_NOTCH = 8
/** Width of the box border; the label is positioned from inside it. */
const BORDER = 2

const CSS = `
  :host { all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647; }
  [hidden] { display: none !important; }
  .box {
    position: fixed; top: 0; left: 0; box-sizing: border-box;
    border: ${BORDER}px solid ${BLUE}; border-radius: 2px;
  }
  .box.hover { border-style: dashed; border-color: rgba(59, 130, 246, 0.6); }
  .label {
    position: absolute; left: ${LABEL_NOTCH - BORDER}px; bottom: 100%; margin-bottom: ${BORDER}px;
    display: flex; align-items: center; padding: 0 6px; border-radius: 3px 3px 0 0; white-space: nowrap;
    font: 500 11px/16px system-ui, -apple-system, sans-serif;
    color: #fff; background: ${BLUE};
  }
  .label:empty, .name:empty, .crumbs:empty { display: none; }
  .box.hover .label { background: rgba(59, 130, 246, 0.8); }
  .box[data-inside] .label { bottom: auto; top: 0; margin: 0; border-radius: 0 0 3px 3px; }
  .bar { pointer-events: auto; line-height: 20px; padding-right: 2px; user-select: none; -webkit-user-select: none; }
  .crumbs { display: flex; align-items: center; }
  .crumb { all: unset; cursor: pointer; opacity: 0.75; max-width: 12em; overflow: hidden; text-overflow: ellipsis; border-radius: 2px; }
  .crumb:hover { opacity: 1; text-decoration: underline; }
  .sep, .more { opacity: 0.6; padding: 0 4px; }
  .name { max-width: 16em; overflow: hidden; text-overflow: ellipsis; }
  .tools { display: flex; margin-left: 6px; padding-left: 2px; border-left: 1px solid rgba(255, 255, 255, 0.35); }
  .tool {
    all: unset; box-sizing: border-box; display: grid; place-items: center;
    width: 20px; height: 20px; border-radius: 2px; cursor: pointer;
  }
  .tool:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); }
  .tool[aria-pressed='true'] { background: rgba(255, 255, 255, 0.3); }
  .tool:disabled { opacity: 0.4; cursor: default; }
  .tool svg { width: 14px; height: 14px; }
  .handle { cursor: grab; touch-action: none; }
  :host([data-dragging]) .handle { cursor: grabbing; }
  .crumb:focus-visible, .tool:focus-visible { outline: 2px solid #fff; outline-offset: -2px; }
  .indicator {
    position: fixed; top: 0; left: 0; border-radius: 2px;
    background: ${BLUE}; box-shadow: 0 0 0 1px #fff;
  }
`

const TOOLS: { action: BlockAction; label: string; icon: string }[] = [
  { action: 'move-up', label: 'Move up', icon: '<path d="M12 19V5M6 11l6-6 6 6"/>' },
  { action: 'move-down', label: 'Move down', icon: '<path d="M12 5v14M6 13l6 6 6-6"/>' },
  {
    action: 'insert-before',
    label: 'Add block before',
    icon: '<path d="M4 4h16M12 9v10M7 14h10"/>',
  },
  {
    action: 'insert-after',
    label: 'Add block after',
    icon: '<path d="M4 20h16M12 5v10M7 10h10"/>',
  },
  {
    action: 'duplicate',
    label: 'Duplicate',
    icon: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  },
  {
    action: 'delete',
    label: 'Delete',
    icon: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  },
]

const EYE_ICON =
  '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
const EYE_OFF_ICON =
  '<path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-1.7 2.6M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/>'

const GRIP_ICON =
  '<g fill="currentColor" stroke="none"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></g>'

const ALT_CLICK_HINT = 'Alt/Option-click to use links and buttons on the page'

export function createOverlayUi(handlers: OverlayHandlers): OverlayUi {
  const host = document.createElement('div')
  host.id = 'b10cks-overlay'
  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = CSS
  root.appendChild(style)

  const hoverBox = element('div', 'box hover')
  hoverBox.hidden = true
  const hoverLabel = element('div', 'label name')
  hoverBox.appendChild(hoverLabel)

  const selectedBox = element('div', 'box selected')
  selectedBox.hidden = true
  const bar = element('div', 'label bar')
  const crumbs = element('span', 'crumbs')
  const name = element('span', 'name')
  name.title = ALT_CLICK_HINT
  const tools = element('div', 'tools')
  tools.setAttribute('role', 'toolbar')
  tools.setAttribute('aria-label', 'Block actions')

  const handle = element('div', 'tool handle')
  handle.title = 'Drag to move'
  // Pointer only; keyboard users move blocks with the buttons.
  handle.setAttribute('aria-hidden', 'true')
  handle.innerHTML = icon(GRIP_ICON)
  handle.addEventListener('pointerdown', (event) => handlers.onDragStart(event, handle))

  const buttons = new Map<BlockAction, HTMLButtonElement>()
  for (const tool of TOOLS) {
    const button = element('button', 'tool')
    button.type = 'button'
    button.title = tool.label
    button.setAttribute('aria-label', tool.label)
    button.innerHTML = icon(tool.icon)
    button.addEventListener('click', () => handlers.onAction(tool.action))
    buttons.set(tool.action, button)
    tools.appendChild(button)
  }

  // Sends the target state, not a toggle, so two quick clicks can't undo each other.
  let hidden = false
  const visibility = element('button', 'tool')
  visibility.type = 'button'
  visibility.addEventListener('click', () => handlers.onAction(hidden ? 'show' : 'hide'))
  const setHidden = (next: boolean) => {
    hidden = next
    const label = hidden ? 'Show' : 'Hide'
    visibility.title = label
    visibility.setAttribute('aria-label', label)
    visibility.setAttribute('aria-pressed', String(hidden))
    visibility.innerHTML = icon(hidden ? EYE_OFF_ICON : EYE_ICON)
  }
  setHidden(false)
  tools.insertBefore(visibility, buttons.get('delete') ?? null)

  bar.append(handle, crumbs, name, tools)
  selectedBox.appendChild(bar)

  const indicator = element('div', 'indicator')
  indicator.hidden = true

  root.append(hoverBox, selectedBox, indicator)
  document.body.appendChild(host)

  let crumbKey = ''

  return {
    host,
    selected: { box: selectedBox, label: bar, name },
    hover: { box: hoverBox, label: hoverLabel, name: hoverLabel },
    indicator,
    renderBar(model) {
      bar.hidden = !model || (!model.label && model.crumbs.length === 0 && !model.actions)
      if (!model) return

      // Rebuild the breadcrumb only when it changed, so a focused crumb keeps focus.
      const key = model.crumbs.map((crumb) => `${crumb.id}\u0000${crumb.label}`).join('\u0001')
      if (key !== crumbKey) {
        crumbKey = key
        crumbs.replaceChildren(...renderCrumbs(model.crumbs, handlers.onSelect))
      }
      name.textContent = model.label
      tools.hidden = !model.actions
      handle.hidden = !model.actions
      setDisabled(buttons.get('move-up'), !model.actions?.canMoveUp)
      setDisabled(buttons.get('move-down'), !model.actions?.canMoveDown)

      const state = model.actions?.hidden ?? null
      visibility.hidden = state === null
      if (state !== null && state !== hidden) setHidden(state)
    },
    setDragging(dragging) {
      host.toggleAttribute('data-dragging', dragging)
    },
  }
}

function renderCrumbs(crumbs: Crumb[], onSelect: (id: string) => void): HTMLElement[] {
  const nodes: HTMLElement[] = []
  const hidden = crumbs.slice(0, -MAX_CRUMBS)
  if (hidden.length > 0) {
    const more = element('span', 'more')
    more.textContent = '…'
    more.title = hidden.map((crumb) => crumb.label).join(' › ')
    nodes.push(more, separator())
  }
  for (const crumb of crumbs.slice(-MAX_CRUMBS)) {
    const button = element('button', 'crumb')
    button.type = 'button'
    button.textContent = crumb.label
    button.title = `Select ${crumb.label}`
    button.addEventListener('click', () => onSelect(crumb.id))
    nodes.push(button, separator())
  }
  return nodes
}

function separator(): HTMLElement {
  const sep = element('span', 'sep')
  sep.textContent = '›'
  sep.setAttribute('aria-hidden', 'true')
  return sep
}

function setDisabled(button: HTMLButtonElement | undefined, disabled: boolean) {
  if (button) button.disabled = disabled
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  el.className = className
  return el
}

function icon(paths: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`
}
