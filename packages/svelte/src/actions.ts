import { type AttachEditableFieldOptions, attachEditable, attachEditableField } from '@b10cks/client'

export function editable(node: HTMLElement, block: { id?: string }) {
  let cleanup = attachEditable(node, { id: block?.id ?? '' })

  return {
    update(next: { id?: string }) {
      cleanup()
      cleanup = attachEditable(node, { id: next?.id ?? '' })
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
