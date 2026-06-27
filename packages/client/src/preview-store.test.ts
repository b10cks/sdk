import { describe, expect, it, vi } from 'vitest'

import { getAtPath, PreviewStore, setAtPath } from './preview-store'

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
