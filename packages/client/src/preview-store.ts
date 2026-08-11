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

/**
 * Depth-first search for the path to the node carrying `id`. The root node
 * itself is not considered a match — callers handle the root explicitly.
 */
export function findPathById(root: unknown, id: string): FieldPath | null {
  const search = (node: unknown, path: FieldPath): FieldPath | null => {
    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index++) {
        const found = search(node[index], [...path, index])
        if (found) {
          return found
        }
      }
      return null
    }

    if (!node || typeof node !== 'object') {
      return null
    }

    const record = node as Record<string, unknown>
    if (path.length > 0 && record.id === id) {
      return path
    }

    for (const key of Object.keys(record)) {
      const value = record[key]
      if (value && typeof value === 'object') {
        const found = search(value, [...path, key])
        if (found) {
          return found
        }
      }
    }

    return null
  }

  return search(root, [])
}

/**
 * Merge a `CONTENT_UPDATE` payload into an existing content tree.
 *
 * The editor sends updates scoped to the edited item — the payload is the block
 * that changed, carrying its own `id` — and only sends the whole tree when the
 * root block itself is edited (as `{ id: entryId, ...entryContent }`). Blindly
 * assigning the payload as the new root therefore collapses the page to the
 * edited block, so the payload is instead matched by `id`:
 *
 * - payload without an `id` → treated as the whole tree (legacy/whole-tree push)
 * - payload id equal to the root's id → replaces the root
 * - payload id found in the tree → replaces that node in place, immutably
 * - payload id found nowhere → ignored (an update for a block not rendered here)
 *
 * When the root is rendered without its entry id (`entry.content` alone, so the
 * root has no `id` to match) an update that matches nothing nested but has the
 * same `block` type as the root is taken as the root.
 */
export function mergeContentUpdate<T>(root: T, update: Record<string, unknown>): T {
  if (!update || typeof update !== 'object') {
    return root
  }

  const updateId = typeof update.id === 'string' ? update.id : undefined
  if (!updateId) {
    return update as unknown as T
  }

  if (!root || typeof root !== 'object') {
    return update as unknown as T
  }

  const rootRecord = root as unknown as Record<string, unknown>
  const rootId = typeof rootRecord.id === 'string' ? rootRecord.id : undefined
  if (rootId === updateId) {
    return update as unknown as T
  }

  const path = findPathById(root, updateId)
  if (path) {
    return setAtPath(root, path, update)
  }

  if (!rootId && rootRecord.block !== undefined && rootRecord.block === update.block) {
    return update as unknown as T
  }

  return root
}

type Listener = () => void

/**
 * A framework-agnostic, reactive holder for the content tree shown in the
 * preview. The editor pushes block-scoped (`CONTENT_UPDATE`) or granular
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

  /**
   * Apply an editor `CONTENT_UPDATE` payload. See {@link mergeContentUpdate}:
   * scoped payloads are merged by `id` instead of replacing the whole tree.
   * Unknown ids are ignored and do not notify subscribers.
   */
  applyContentUpdate(update: Record<string, unknown>) {
    const next = mergeContentUpdate(this.content, update)
    if (next === this.content) {
      return
    }
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
    store.applyContentUpdate(content)
  })
  const offPatch = previewBridge.on('CONTENT_PATCH', ({ path, value }) => {
    store.patch(path, value)
  })

  return () => {
    offUpdate()
    offPatch()
  }
}
