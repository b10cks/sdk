import { bindPreviewStore, PreviewStore } from '@b10cks/client'
import { readable, type Readable } from 'svelte/store'

/**
 * A readable store of the content tree that live-updates while editing in the
 * b10cks editor (including complex fields like rich text). Outside preview mode
 * it just holds `initial`.
 *
 * ```svelte
 * const content = createPreviewContent(data.content)
 * // <B10cksComponent block={$content} />
 * ```
 */
export function createPreviewContent<T>(initial: T): Readable<T> {
  return readable<T>(initial, (set) => {
    const store = new PreviewStore<T>(initial)
    const off = store.subscribe(() => set(store.getSnapshot()))
    const offBridge = bindPreviewStore(store)
    return () => {
      off()
      offBridge()
    }
  })
}
