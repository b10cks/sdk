import { previewBridge, type SelectUpdateEvent } from '@b10cks/client'

export function editable(node: HTMLElement, block: { id?: string }) {
  if (!previewBridge.isInPreviewMode()) {
    return {}
  }

  const blockId = block?.id
  if (!blockId) {
    return {}
  }

  node.classList.add('b10cks-preview')

  const handleClick = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    previewBridge.selectItem(blockId)
  }

  const handleSelectionChange = ({ selectedItem }: SelectUpdateEvent) => {
    if (selectedItem === blockId) {
      node.classList.add('b10cks-selected')
      node.scrollIntoView({ behavior: 'smooth' })
      return
    }

    node.classList.remove('b10cks-selected')
  }

  const handleHoverChange = ({ selectedItem }: SelectUpdateEvent) => {
    if (selectedItem === blockId) {
      node.classList.add('b10cks-hover')
      return
    }

    node.classList.remove('b10cks-hover')
  }

  node.addEventListener('click', handleClick)
  const offSelection = previewBridge.on('SELECT_UPDATE', handleSelectionChange)
  const offHover = previewBridge.on('HOVER_UPDATE', handleHoverChange)

  return {
    destroy() {
      node.removeEventListener('click', handleClick)
      offSelection()
      offHover()
      node.classList.remove('b10cks-preview', 'b10cks-selected', 'b10cks-hover')
    },
  }
}

export function editableField(node: HTMLElement, payload: { id: string; field: string }) {
  if (!previewBridge.isInPreviewMode()) {
    return {}
  }

  node.setAttribute('contenteditable', 'true')

  const handleInput = (event: Event) => {
    const value = (event.target as HTMLElement).innerText
    previewBridge.updateField(payload.id, payload.field, value)
  }

  node.addEventListener('input', handleInput)

  return {
    destroy() {
      node.removeEventListener('input', handleInput)
      node.removeAttribute('contenteditable')
    },
  }
}

if (previewBridge.isInPreviewMode() && typeof document !== 'undefined') {
  const styleId = 'b10cks-preview-style'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.innerHTML = `
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
}
