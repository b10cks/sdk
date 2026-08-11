import { describe, expect, it } from 'vitest'

import { toRootBlock } from './content'
import type { IBContent } from './types'

const entry = {
  id: 'entry-1',
  name: 'Home',
  slug: 'home',
  block: 'page',
  parent_id: null,
  full_slug: 'home',
  content: { block: 'page', body: [{ id: 'hero', block: 'hero' }] },
  language_iso: 'en',
  translations: [],
  published_at: null,
  first_published_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
} as unknown as IBContent<Record<string, unknown>>

describe('toRootBlock', () => {
  it('carries the entry id into the root block', () => {
    const block = toRootBlock(entry)

    expect(block).toEqual({
      id: 'entry-1',
      block: 'page',
      body: [{ id: 'hero', block: 'hero' }],
    })
  })

  it('falls back to the entry block when the content object has none', () => {
    const block = toRootBlock({ ...entry, content: { headline: 'hi' } })

    expect(block).toEqual({ id: 'entry-1', block: 'page', headline: 'hi' })
  })

  it('returns null for a missing entry', () => {
    expect(toRootBlock(null)).toBeNull()
    expect(toRootBlock(undefined)).toBeNull()
  })
})
