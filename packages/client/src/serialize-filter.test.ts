import { describe, expect, it } from 'vitest'

import { serializeFilter } from './data-api'

describe('serializeFilter', () => {
  it('passes string values through unchanged', () => {
    expect(serializeFilter({ status: 'published' })).toEqual({ status: 'published' })
  })

  it('stringifies numbers and booleans', () => {
    expect(serializeFilter({ count: 5, active: true })).toEqual({
      count: '5',
      active: 'true',
    })
  })

  it('omits null and undefined values', () => {
    expect(serializeFilter({ a: null, b: undefined, c: 'keep' })).toEqual({ c: 'keep' })
  })

  it('serializes comparison operators', () => {
    expect(serializeFilter({ age: { gte: 18 } })).toEqual({ age: 'gte:18' })
    expect(serializeFilter({ name: { like: 'foo' } })).toEqual({ name: 'like:foo' })
    expect(serializeFilter({ slug: { neq: 'home' } })).toEqual({ slug: 'neq:home' })
  })

  it('joins array operands with commas', () => {
    expect(serializeFilter({ tags: { in: ['a', 'b', 'c'] } })).toEqual({ tags: 'in:a,b,c' })
  })

  it('serializes between ranges', () => {
    expect(serializeFilter({ price: { between: ['10', '20'] } })).toEqual({ price: '10...20' })
  })

  it('serializes null / not-null markers', () => {
    expect(serializeFilter({ deleted_at: { null: true } })).toEqual({ deleted_at: 'null:' })
    expect(serializeFilter({ deleted_at: { '!null': true } })).toEqual({ deleted_at: '!null:' })
  })

  it('drops keys whose operator is not recognized', () => {
    expect(serializeFilter({ weird: { unknownOp: 1 } })).toEqual({})
  })

  it('serializes multiple fields together', () => {
    expect(
      serializeFilter({
        status: 'published',
        views: { gt: 100 },
        tag: { in: ['news'] },
      })
    ).toEqual({
      status: 'published',
      views: 'gt:100',
      tag: 'in:news',
    })
  })
})
