import { bindPreviewStore, PreviewStore, previewBridge } from '@b10cks/client'
import { onScopeDispose, shallowRef, type ShallowRef } from 'vue'

/**
 * Returns a reactive ref to the content tree that live-updates while editing in
 * the b10cks editor. Outside preview mode it simply holds `initial`.
 *
 * Pass the result to your root component so editor changes — including complex
 * fields like rich text — re-render automatically:
 *
 * ```ts
 * const content = usePreviewContent(data.value.content)
 * // <B10cksComponent :block="content" />
 * ```
 */
export function usePreviewContent<T extends Record<string, unknown>>(
  initial: T
): ShallowRef<T> {
  const content = shallowRef(initial) as ShallowRef<T>

  if (!previewBridge.isInPreviewMode()) {
    return content
  }

  const store = new PreviewStore<T>(initial)
  const offStore = store.subscribe(() => {
    content.value = store.getSnapshot()
  })
  const offBridge = bindPreviewStore(store)

  onScopeDispose(() => {
    offStore()
    offBridge()
  })

  return content
}
