import { attachEditable, type ContentUpdateEvent, previewBridge } from '@b10cks/client'
import type { DirectiveBinding, VNode } from 'vue'

interface EditableElement extends HTMLElement {
  _editableCleanup?: () => void
}

function bind(el: EditableElement, binding: DirectiveBinding, vnode: VNode) {
  const block = binding.value
  const id = block?.id
  if (!id) {
    // biome-ignore lint/suspicious/noConsole: give developers feedback
    console.warn('v-editable directive requires a block with an id')
    return
  }

  const detach = attachEditable(el, { id })

  // Backwards-compatible live updates: when the editor pushes new content for
  // this block, patch the bound block in place so the rendering component
  // updates — no `usePreviewContent` wiring required. Prefer `usePreviewContent`
  // for new code; it updates the whole tree (incl. nested/rich text) reactively.
  const offContent = previewBridge.on('CONTENT_UPDATE', ({ content }: ContentUpdateEvent) => {
    if (!content || (content as { id?: string }).id !== id) return
    patchBlockInPlace(block, content)
    forceHostUpdate(vnode)
  })

  el._editableCleanup = () => {
    detach()
    offContent()
  }
}

/**
 * Replace the bound block's fields in place. Mutating the same object the
 * component renders keeps a reactive content tree in sync without swapping the
 * reference (which would detach reactivity for later updates).
 */
function patchBlockInPlace(target: unknown, content: Record<string, unknown>) {
  if (!target || typeof target !== 'object') return
  const obj = target as Record<string, unknown>
  for (const key of Object.keys(obj)) {
    if (!(key in content)) {
      delete obj[key]
    }
  }
  Object.assign(obj, content)
}

/** Force the host component to re-render for blocks that aren't reactive. */
function forceHostUpdate(vnode: VNode) {
  try {
    const ctx = (vnode as unknown as { ctx?: { update?: () => void } }).ctx
    ctx?.update?.()
  } catch {
    // Vue internals unavailable; the in-place mutation is the best effort.
  }
}

/**
 * The block id to render as the element's `id`, so internal links with an `anchor` can jump to
 * the block. Opt out with `v-editable.noanchor`. An `id` on the element itself wins.
 */
function anchorId(binding: DirectiveBinding, vnode: VNode | null): string | undefined {
  if (binding.modifiers.noanchor || vnode?.props?.id != null) return undefined
  const id: unknown = binding.value?.id
  return typeof id === 'string' && id ? id : undefined
}

function applyAnchor(el: EditableElement, binding: DirectiveBinding, vnode: VNode) {
  if (binding.modifiers.noanchor) return

  const ownId: unknown = vnode.props?.id
  if (ownId != null) {
    // Compiled SSR templates can't see the element's own id (getSSRProps gets no vnode), so the
    // server may have rendered the block id. Hydration doesn't patch `id`; restore it here.
    if (el.id !== String(ownId)) el.id = String(ownId)
    return
  }

  const id = anchorId(binding, vnode)
  if (id) {
    el.id = id
  } else if (el.id && el.id === binding.oldValue?.id) {
    el.removeAttribute('id')
  }
}

export const EditableDirective = {
  getSSRProps(binding: DirectiveBinding, vnode: VNode | null) {
    const id = anchorId(binding, vnode)
    return id ? { id } : {}
  },

  // `created` runs on client-only renders and on hydration, before first paint. Vue skips the
  // hydration prop mismatch check for elements whose directives define `created`.
  created(el: EditableElement, binding: DirectiveBinding, vnode: VNode) {
    applyAnchor(el, binding, vnode)
  },

  mounted(el: EditableElement, binding: DirectiveBinding, vnode: VNode) {
    bind(el, binding, vnode)
  },

  updated(el: EditableElement, binding: DirectiveBinding, vnode: VNode) {
    applyAnchor(el, binding, vnode)
    if (binding.value?.id !== binding.oldValue?.id) {
      el._editableCleanup?.()
      bind(el, binding, vnode)
    }
  },

  unmounted(el: EditableElement) {
    el._editableCleanup?.()
    delete el._editableCleanup
  },
}
