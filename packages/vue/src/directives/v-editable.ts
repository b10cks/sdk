import type { Directive, DirectiveBinding, VNode } from 'vue'
import type { SelectUpdateEvent } from '../preview-bridge'
import { previewBridge } from '../preview-bridge'

interface EditableElement extends HTMLElement {
  _editableCleanup?: () => void
}

export const EditableDirective = {
  mounted(el: EditableElement, binding: DirectiveBinding, node: VNode) {
    if (!previewBridge.isInPreviewMode()) return
    const { id: itemId } = binding.value

    if (!itemId) {
      console.warn('v-editable directive requires a block with an id')
      return
    }

    el.classList.add('b10cks-preview')

    const handleClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      previewBridge.selectItem(itemId)
    }

    const handleSelectionChange = ({ selectedItem }: SelectUpdateEvent) => {
      if (!node.el) return

      if (selectedItem === itemId) {
        node.el.classList.add('b10cks-selected')
        scrollIntoViewIfNeeded(el)
      } else {
        node.el.classList.remove('b10cks-selected')
      }
    }

    const handleHoverChange = ({ selectedItem }: SelectUpdateEvent) => {
      if (!node.el) return

      if (selectedItem === itemId) {
        node.el.classList.add('b10cks-hover')
      } else {
        node.el.classList.remove('b10cks-hover')
      }
    }

    const handleUpdate = ({ content }: { content: any }) => {
      if (content && content.id === itemId) {
        if (node.component) {
          if (node.component.parent && node.component.parent.attrs) {
            node.component.parent.attrs.block = content
          }
          node.component.props.block = content
          node.component.update()
        }
      }
    }

    el.addEventListener('click', handleClick)
    previewBridge.on('SELECT_UPDATE', handleSelectionChange)
    previewBridge.on('HOVER_UPDATE', handleHoverChange)
    previewBridge.on('CONTENT_UPDATE', handleUpdate)

    el._editableCleanup = () => {
      el.removeEventListener('click', handleClick)
    }
  },

  updated(el: EditableElement, binding: DirectiveBinding, vnode: VNode) {
    if (!previewBridge.isInPreviewMode()) return

    if (binding.value !== binding.oldValue) {
      if (el._editableCleanup) {
        el._editableCleanup()
      }

      EditableDirective.mounted(el, binding, vnode)
    }
  },

  unmounted(el: EditableElement) {
    if (!previewBridge.isInPreviewMode()) return

    if (el._editableCleanup) {
      el._editableCleanup()
      delete el._editableCleanup
    }

    el.classList.remove('b10cks-preview', 'b10cks-selected')
  }
}

function scrollIntoViewIfNeeded(el: HTMLElement) {
  if (el.scrollIntoView) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

if (previewBridge.isInPreviewMode()) {
  const style = document.createElement('style')
  style.innerHTML = `
    .b10cks-preview {
      cursor: pointer;
    }
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