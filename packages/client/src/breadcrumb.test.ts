import { describe, expect, it } from 'vitest'

import { breadcrumbJsonLd } from './breadcrumb'
import type { IBBreadcrumbLevel } from './types'

const level = (
  name: string,
  path: string,
  depth: number,
  overrides: Partial<IBBreadcrumbLevel> = {}
): IBBreadcrumbLevel =>
  ({
    id: path,
    name,
    path,
    depth,
    is_root: depth === 0,
    is_current: false,
    ...overrides,
  }) as IBBreadcrumbLevel

describe('breadcrumbJsonLd', () => {
  it('numbers items consecutively and absolutizes paths', () => {
    const jsonLd = breadcrumbJsonLd(
      // `depth` 2 is missing: an unpublished ancestor was dropped by the API.
      [level('Home', '/en', 0), level('Shoes', '/en/products/shoes', 3, { is_current: true })],
      { siteUrl: 'https://example.com' }
    )

    expect(jsonLd.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://example.com/en',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shoes',
        item: 'https://example.com/en/products/shoes',
      },
    ])
  })

  it('keeps relative paths without a site URL and can drop the current entry', () => {
    const jsonLd = breadcrumbJsonLd(
      [level('Home', '/en', 0), level('Shoes', '/en/shoes', 1, { is_current: true })],
      { excludeCurrent: true }
    )

    expect(jsonLd['@type']).toBe('BreadcrumbList')
    expect(jsonLd.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: '/en' },
    ])
  })
})
