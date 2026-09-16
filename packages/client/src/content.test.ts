import { describe, expect, it } from 'vitest'

import { blockAnchorAttrs, resolveB10cksLink, toRootBlock } from './content'
import type { B10cksLink, IBContent } from './types'

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

describe('resolveB10cksLink', () => {
  const internal = (link: Partial<Extract<B10cksLink, { type: 'internal' }>>): B10cksLink => ({
    type: 'internal',
    url: '/about',
    title: 'About',
    content: 'content-1',
    ...link,
  })

  it('leaves links without anchor or params unchanged', () => {
    expect(resolveB10cksLink(internal({}))).toEqual({ href: '/about', target: '_self' })
    expect(
      resolveB10cksLink({ type: 'url', url: 'https://example.com', target: '_blank' })
    ).toEqual({ href: 'https://example.com', target: '_blank' })
  })

  it('appends the anchor as a fragment', () => {
    expect(resolveB10cksLink(internal({ anchor: '01kh6h981yh1s5z7s3f80wmrw2' }))?.href).toBe(
      '/about#01kh6h981yh1s5z7s3f80wmrw2'
    )
  })

  it('puts params before the anchor', () => {
    const link = internal({ params: { ref: 'nav', q: 'a b' }, anchor: 'team' })
    expect(resolveB10cksLink(link)?.href).toBe('/about?ref=nav&q=a+b#team')
  })

  it('joins params onto an existing query string', () => {
    expect(resolveB10cksLink(internal({ url: '/about?x=1', params: 'ref=nav' }))?.href).toBe(
      '/about?x=1&ref=nav'
    )
  })

  it('does not double an existing fragment', () => {
    const link: B10cksLink = { type: 'url', url: '/about#top', anchor: 'team', params: { a: '1' } }
    expect(resolveB10cksLink(link)?.href).toBe('/about?a=1#top')
  })

  it('encodes the anchor', () => {
    expect(resolveB10cksLink(internal({ anchor: 'a b/c' }))?.href).toBe('/about#a%20b%2Fc')
  })
})

describe('blockAnchorAttrs', () => {
  it('returns the block id', () => {
    expect(blockAnchorAttrs({ id: '01kh6h981yh1s5z7s3f80wmrw2' })).toEqual({
      id: '01kh6h981yh1s5z7s3f80wmrw2',
    })
  })

  it('returns no attributes without an id', () => {
    expect(blockAnchorAttrs({ id: '' })).toEqual({})
    expect(blockAnchorAttrs({ id: null })).toEqual({})
    expect(blockAnchorAttrs(undefined)).toEqual({})
  })
})
