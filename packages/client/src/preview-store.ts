import type { FieldPath } from './preview-bridge'

import { previewBridge } from './preview-bridge'

/** Read the value at `path` within `target`, or undefined if absent. */
export function getAtPath(target: unknown, path: FieldPath): unknown {
  let current = target
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string | number, unknown>)[key]
  }
  return current
}

/** Return a copy of `target` with the value at `path` replaced. Immutable. */
export function setAtPath<T>(target: T, path: FieldPath, value: unknown): T {
  if (path.length === 0) {
    return value as T
  }

  const [key, ...rest] = path
  if (key === undefined) {
    return value as T
  }

  if (typeof key === 'number') {
    const next = Array.isArray(target) ? (target as unknown[]).slice() : []
    next[key] = setAtPath(next[key], rest, value)
    return next as unknown as T
  }

  const next: Record<string, unknown> =
    target && typeof target === 'object' && !Array.isArray(target)
      ? { ...(target as Record<string, unknown>) }
      : {}
  next[key] = setAtPath(next[key], rest, value)
  return next as T
}

type Listener = () => void

/**
 * A framework-agnostic, reactive holder for the content tree shown in the
 * preview. The editor pushes whole-tree (`CONTENT_UPDATE`) or granular
 * (`CONTENT_PATCH`) changes; subscribers re-render from the new snapshot.
 */
export class PreviewStore<T = Record<string, unknown>> {
  private content: T
  private readonly listeners = new Set<Listener>()

  constructor(initial: T) {
    this.content = initial
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): T => this.content

  setContent(next: T) {
    this.content = next
    this.emit()
  }

  patch(path: FieldPath, value: unknown) {
    this.content = setAtPath(this.content, path, value)
    this.emit()
  }

  private emit() {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

/**
 * Feed the singleton bridge's content events into a {@link PreviewStore}.
 * Returns an unsubscribe function. No-op outside preview mode.
 */
export function bindPreviewStore<T>(store: PreviewStore<T>): () => void {
  const offUpdate = previewBridge.on('CONTENT_UPDATE', ({ content }) => {
    store.setContent(content as T)
  })
  const offPatch = previewBridge.on('CONTENT_PATCH', ({ path, value }) => {
    store.patch(path, value)
  })

  return () => {
    offUpdate()
    offPatch()
  }
}
