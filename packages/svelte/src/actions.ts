import {
  type AttachEditableFieldOptions,
  attachEditable,
  attachEditableField,
} from '@b10cks/client'

type EditableBlock = { id?: string; block?: string }

export function editable(node: HTMLElement, block: EditableBlock) {
  let cleanup = attachEditable(node, { id: block?.id ?? '', label: block?.block })

  return {
    update(next: EditableBlock) {
      cleanup()
      cleanup = attachEditable(node, { id: next?.id ?? '', label: next?.block })
    },
    destroy() {
      cleanup()
    },
  }
}

export function editableField(node: HTMLElement, options: AttachEditableFieldOptions) {
  let cleanup = attachEditableField(node, options)

  return {
    update(next: AttachEditableFieldOptions) {
      cleanup()
      cleanup = attachEditableField(node, next)
    },
    destroy() {
      cleanup()
    },
  }
}
