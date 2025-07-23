import { previewBridge } from '../preview-bridge'
import type { Directive, DirectiveBinding } from 'vue'

export const EditableContentDirective: Directive<HTMLElement> = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { id: itemId, field } = binding.value
    if (!previewBridge.isInPreviewMode()) return
    el.setAttribute('contenteditable', 'true')

    el.addEventListener('input', (event: Event) => {
      previewBridge.updateField(itemId, field, (event.target as HTMLInputElement).innerText)
    })
  }
}
