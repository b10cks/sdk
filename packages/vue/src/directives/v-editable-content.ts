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

export const EditableContentDirective: Directive<EditableFieldElement> = {
  mounted(el: EditableFieldElement, binding: DirectiveBinding<EditableFieldBinding>) {
    const { id, field, path, mode } = binding.value ?? ({} as EditableFieldBinding)
    if (!id) {
      // biome-ignore lint/suspicious/noConsole: give developers feedback
      console.warn('v-editable-field directive requires a block id')
      return
    }
    el._editableFieldCleanup = attachEditableField(el, { id, field, path, mode })
  },

  unmounted(el: EditableFieldElement) {
    el._editableFieldCleanup?.()
    delete el._editableFieldCleanup
  },
}
