import { bindPreviewStore, PreviewStore, previewBridge } from '@b10cks/client'
import { onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter, type ShallowRef } from 'vue'

/**
 * Returns a reactive ref to the content tree that live-updates while editing in
 * the b10cks editor. Outside preview mode it simply holds `initial`.
 *
 * `initial` may be a plain value, a ref, or a getter. When it is reactive (e.g.
 * refetched on a route/locale change) the preview store is reset to the new
 * tree instead of keeping the first one.
 *
 * ```ts
 * const content = usePreviewContent(() => data.value.content)
 * // <B10cksComponent :block="content" />
 * ```
 */
export function usePreviewContent<T extends Record<string, unknown>>(
  initial: MaybeRefOrGetter<T>
): ShallowRef<T> {
  const content = shallowRef(toValue(initial)) as ShallowRef<T>

  if (!previewBridge.isInPreviewMode()) {
    // Still track a reactive source so the value stays in sync outside preview.
    const stop = watch(
      () => toValue(initial),
      (next) => {
        content.value = next
      }
    )
    onScopeDispose(stop)
    return content
  }

  const store = new PreviewStore<T>(toValue(initial))
  const offStore = store.subscribe(() => {
    content.value = store.getSnapshot()
  })
  const offBridge = bindPreviewStore(store)

  // Reset the store when the source content changes identity.
  const stopWatch = watch(
    () => toValue(initial),
    (next) => {
      store.setContent(next)
    }
  )

  onScopeDispose(() => {
    stopWatch()
    offStore()
    offBridge()
  })

  return content
}
