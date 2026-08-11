import { describe, expect, it, vi } from 'vitest'

import {
  findPathById,
  getAtPath,
  mergeContentUpdate,
  PreviewStore,
  setAtPath,
} from './preview-store'

describe('getAtPath', () => {
  it('reads nested object and array values', () => {
    const obj = { a: { b: [{ c: 1 }, { c: 2 }] } }
    expect(getAtPath(obj, ['a', 'b', 1, 'c'])).toBe(2)
  })

  it('returns undefined for missing paths', () => {
    expect(getAtPath({ a: 1 }, ['a', 'b', 'c'])).toBeUndefined()
    expect(getAtPath(null, ['a'])).toBeUndefined()
  })

  it('returns the target itself for an empty path', () => {
    const obj = { a: 1 }
    expect(getAtPath(obj, [])).toBe(obj)
  })
})

describe('setAtPath', () => {
  it('replaces a nested value immutably', () => {
    const obj = { a: { b: 1 }, keep: true }
    const next = setAtPath(obj, ['a', 'b'], 2)

    expect(next).toEqual({ a: { b: 2 }, keep: true })
    expect(obj.a.b).toBe(1) // original untouched
    expect(next).not.toBe(obj)
    expect(next.a).not.toBe(obj.a)
  })

  it('updates an array element by numeric index without mutating the source', () => {
    const obj = { items: [{ v: 'a' }, { v: 'b' }] }
    const next = setAtPath(obj, ['items', 1, 'v'], 'B')

    expect(next.items[1]?.v).toBe('B')
    expect(next.items[0]).toBe(obj.items[0]) // untouched sibling shares reference
    expect(obj.items[1]?.v).toBe('b')
  })

  it('creates missing intermediate containers based on key type', () => {
    const next = setAtPath({}, ['a', 0, 'b'], 'x')
    expect(next).toEqual({ a: [{ b: 'x' }] })
  })

  it('returns the value for an empty path', () => {
    expect(setAtPath({ a: 1 }, [], 'replaced')).toBe('replaced')
  })
})

describe('findPathById', () => {
  it('finds nested nodes in objects and arrays', () => {
    const tree = {
      id: 'root',
      body: [{ id: 'a', columns: [{ id: 'b' }] }],
      hero: { id: 'c' },
    }

    expect(findPathById(tree, 'a')).toEqual(['body', 0])
    expect(findPathById(tree, 'b')).toEqual(['body', 0, 'columns', 0])
    expect(findPathById(tree, 'c')).toEqual(['hero'])
  })

  it('never matches the root itself and returns null for unknown ids', () => {
    expect(findPathById({ id: 'root' }, 'root')).toBeNull()
    expect(findPathById({ id: 'root' }, 'nope')).toBeNull()
  })
})

describe('mergeContentUpdate', () => {
  it('treats a payload without an id as the whole tree', () => {
    const update = { block: 'page', body: [] }
    expect(mergeContentUpdate({ id: 'root', block: 'page' }, update)).toBe(update)
  })

  it('treats a matching block type as the root when the root carries no id', () => {
    // The docs shape `usePreviewContent(() => data.value.content)` has no id on
    // the root, while the editor pushes `{ id: entryId, ...content }`.
    const update = { id: 'entry-1', block: 'page', body: [{ id: 'hero', block: 'hero' }] }
    expect(mergeContentUpdate({ block: 'page', body: [] }, update)).toBe(update)
  })

  it('still merges nested updates when the root carries no id', () => {
    const root = { block: 'page', body: [{ id: 'hero', block: 'hero', headline: 'old' }] }
    const merged = mergeContentUpdate(root, { id: 'hero', block: 'hero', headline: 'new' })

    expect(merged.block).toBe('page')
    expect(merged.body[0]?.headline).toBe('new')
  })

  it('returns the original tree for an unknown id of a different block type', () => {
    const root = { block: 'page', body: [] }
    expect(mergeContentUpdate(root, { id: 'x', block: 'hero' })).toBe(root)
  })
})

describe('PreviewStore', () => {
  it('notifies subscribers on setContent and exposes the snapshot', () => {
    const store = new PreviewStore<{ title: string }>({ title: 'old' })
    const listener = vi.fn()
    const off = store.subscribe(listener)

    store.setContent({ title: 'new' })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()).toEqual({ title: 'new' })

    off()
    store.setContent({ title: 'newer' })
    expect(listener).toHaveBeenCalledTimes(1) // no longer notified
  })

  it('merges a scoped content update into the tree instead of replacing the root', () => {
    const initial = {
      id: 'root',
      block: 'page',
      body: [
        { id: 'hero', block: 'hero', headline: 'old' },
        { id: 'teaser', block: 'teaser' },
      ],
    }
    const store = new PreviewStore<typeof initial>(initial)
    const listener = vi.fn()
    store.subscribe(listener)

    store.applyContentUpdate({ id: 'hero', block: 'hero', headline: 'new' })

    const snapshot = store.getSnapshot()
    expect(snapshot.block).toBe('page')
    expect(snapshot.body).toHaveLength(2)
    expect(snapshot.body[0]).toEqual({ id: 'hero', block: 'hero', headline: 'new' })
    expect(snapshot.body[1]).toBe(initial.body[1])
    expect(initial.body[0]?.headline).toBe('old')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('replaces the whole tree when the update targets the root', () => {
    const store = new PreviewStore<Record<string, unknown>>({
      id: 'root',
      block: 'page',
      body: [{ id: 'hero', block: 'hero' }],
    })

    store.applyContentUpdate({ id: 'root', block: 'page', body: [] })

    expect(store.getSnapshot()).toEqual({ id: 'root', block: 'page', body: [] })
  })

  it('ignores an update for a block that is not in the tree', () => {
    const initial = { id: 'root', block: 'page', body: [{ id: 'hero', block: 'hero' }] }
    const store = new PreviewStore(initial)
    const listener = vi.fn()
    store.subscribe(listener)

    store.applyContentUpdate({ id: 'elsewhere', block: 'hero' })

    expect(store.getSnapshot()).toBe(initial)
    expect(listener).not.toHaveBeenCalled()
  })

  it('applies granular patches immutably and notifies', () => {
    const initial = { body: [{ headline: 'a' }] }
    const store = new PreviewStore(initial)
    const listener = vi.fn()
    store.subscribe(listener)

    store.patch(['body', 0, 'headline'], 'b')

    expect(store.getSnapshot()).toEqual({ body: [{ headline: 'b' }] })
    expect(initial.body[0]?.headline).toBe('a')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
