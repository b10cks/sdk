import { bindPreviewStore, PreviewStore } from '@b10cks/client'
import { readable, type Readable } from 'svelte/store'

const isReadable = <T>(value: T | Readable<T>): value is Readable<T> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Readable<T>).subscribe === 'function'

/**
 * A readable store of the content tree that live-updates while editing in the
 * b10cks editor (including complex fields like rich text). Outside preview mode
 * it just holds `initial`.
 *
 * `initial` may be a plain value or a readable store. When a store is passed,
 * its updates (route change, revalidation, locale switch) reset the preview
 * store instead of keeping the first tree.
 *
 * ```svelte
 * const content = createPreviewContent(data.content)
 * // <B10cksComponent block={$content} />
 * ```
 */
export function createPreviewContent<T>(initial: T | Readable<T>): Readable<T> {
  const initialValue = isReadable(initial)
    ? (() => {
        let current: T
        const off = initial.subscribe((v) => (current = v))
        off()
        return current!
      })()
    : initial

  return readable<T>(initialValue, (set) => {
    const store = new PreviewStore<T>(initialValue)
    const off = store.subscribe(() => set(store.getSnapshot()))
    const offBridge = bindPreviewStore(store)
    // When a reactive source is provided, push its updates into the store.
    const offSource = isReadable(initial)
      ? initial.subscribe((next) => store.setContent(next))
      : undefined
    return () => {
      off()
      offBridge()
      offSource?.()
    }
  })
}
