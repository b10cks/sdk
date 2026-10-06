import { attachEditableField, type EditableFieldMode, type FieldPath } from '@b10cks/client'
import type { Directive, DirectiveBinding } from 'vue'

interface EditableFieldElement extends HTMLElement {
  _editableFieldCleanup?: () => void
}

interface EditableFieldBinding {
  id: string
  field?: string
  path?: FieldPath
  mode?: EditableFieldMode
}

/** The address the element edits, to tell when a re-render moved it to another field. */
function addressOf(value: EditableFieldBinding | null | undefined): string {
  return JSON.stringify([value?.id, value?.field, value?.path, value?.mode])
}

function bind(el: EditableFieldElement, value: EditableFieldBinding | undefined) {
  const { id, field, path, mode } = value ?? ({} as EditableFieldBinding)
  if (!id) {
    // biome-ignore lint/suspicious/noConsole: give developers feedback
    console.warn('v-editable-field directive requires a block id')
    return
  }
  el._editableFieldCleanup = attachEditableField(el, { id, field, path, mode })
}

export const EditableContentDirective: Directive<EditableFieldElement> = {
  mounted(el: EditableFieldElement, binding: DirectiveBinding<EditableFieldBinding>) {
    bind(el, binding.value)
  },

  // A keyed list reorder reuses the element for an item at a new index, so
  // edits must follow the new path instead of writing to the old one.
  updated(el: EditableFieldElement, binding: DirectiveBinding<EditableFieldBinding>) {
    if (addressOf(binding.value) === addressOf(binding.oldValue)) return
    el._editableFieldCleanup?.()
    delete el._editableFieldCleanup
    bind(el, binding.value)
  },

  unmounted(el: EditableFieldElement) {
    el._editableFieldCleanup?.()
    delete el._editableFieldCleanup
  },
}
