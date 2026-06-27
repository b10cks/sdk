import {
  type AttachEditableFieldOptions,
  attachEditable,
  attachEditableField,
  bindPreviewStore,
  PreviewStore,
} from '@b10cks/client'
import { type RefObject, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'

/**
 * Attach a ref'd element as a selectable block in the b10cks editor. Returns a
 * ref to spread onto the element. No-op outside preview mode.
 *
 * ```tsx
 * const ref = useEditable<HTMLDivElement>(block.id)
 * return <div ref={ref}>…</div>
 * ```
 */
export function useEditable<T extends HTMLElement = HTMLElement>(
  id?: string | null
): RefObject<T | null> {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!ref.current || !id) {
      return
    }
    return attachEditable(ref.current, { id })
  }, [id])
  return ref
}

/**
 * Attach a ref'd element for field editing. Use `mode: 'select'` for rich text
 * and other complex types so the editor opens its own editor for the field.
 */
export function useEditableField<T extends HTMLElement = HTMLElement>(
  options: AttachEditableFieldOptions
): RefObject<T | null> {
  const ref = useRef<T>(null)
  const key = `${options.id}|${options.field ?? ''}|${options.mode ?? ''}|${(options.path ?? []).join('.')}`
  useEffect(() => {
    if (!ref.current) {
      return
    }
    return attachEditableField(ref.current, options)
    // Re-attach only when the addressing/mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return ref
}

/**
 * Returns the content tree, live-updating while editing in the b10cks editor
 * (including complex fields like rich text). Outside preview mode it returns
 * `initial` unchanged.
 */
export function usePreviewContent<T extends Record<string, unknown>>(initial: T): T {
  const store = useMemo(() => new PreviewStore<T>(initial), [])
  useEffect(() => bindPreviewStore(store), [store])
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
}
