import { describe, expect, it } from 'vitest'

import { buildLocalizedPath, filterSitemapEntries, renderSitemapXml } from './sitemap'
import type { IBSitemapEntry } from './types'

function entry(
  full_slug: string,
  language_iso: string,
  robots: string | null = null
): IBSitemapEntry {
  return {
    id: full_slug,
    name: full_slug,
    full_slug,
    language_iso,
    meta: { robots, canonical: null },
    published_at: '2026-01-01T00:00:00Z',
  }
}

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1] as string)
}

describe('buildLocalizedPath', () => {
  it('roots the home slug and skips a double locale prefix', () => {
    expect(buildLocalizedPath('home', 'de')).toBe('/de')
    expect(buildLocalizedPath('about', 'de')).toBe('/de/about')
    expect(buildLocalizedPath('de/about', 'de')).toBe('/de/about')
    expect(buildLocalizedPath('about', null)).toBe('/about')
    expect(buildLocalizedPath('home', null)).toBe('/')
  })
})

describe('renderSitemapXml locale prefixing', () => {
  const monolingual = [entry('home', 'en'), entry('about', 'en')]
  const multilingual = [entry('about', 'en'), entry('ueber-uns', 'de')]

  it('does not prefix a mono-lingual entry set', () => {
    expect(locs(renderSitemapXml(monolingual, 'https://site.com'))).toEqual([
      'https://site.com/',
      'https://site.com/about',
    ])
  })

  it('prefixes a multilingual entry set', () => {
    expect(locs(renderSitemapXml(multilingual, 'https://site.com'))).toEqual([
      'https://site.com/en/about',
      'https://site.com/de/ueber-uns',
    ])
  })

  it('honors an explicit strategy over the entry set', () => {
    expect(
      locs(renderSitemapXml(monolingual, 'https://site.com', { localePrefix: 'always' }))
    ).toEqual(['https://site.com/en', 'https://site.com/en/about'])
    expect(
      locs(renderSitemapXml(multilingual, 'https://site.com', { localePrefix: 'never' }))
    ).toEqual(['https://site.com/about', 'https://site.com/ueber-uns'])
  })

  it('leaves the default locale unprefixed under except-default', () => {
    const xml = renderSitemapXml(multilingual, 'https://site.com', {
      localePrefix: 'except-default',
      defaultLocale: 'en',
    })
    expect(locs(xml)).toEqual(['https://site.com/about', 'https://site.com/de/ueber-uns'])
  })

  it('emits relative paths without a siteUrl, and lastmod when published', () => {
    const xml = renderSitemapXml([entry('about', 'en')])
    expect(locs(xml)).toEqual(['/about'])
    expect(xml).toContain('<lastmod>2026-01-01T00:00:00Z</lastmod>')
  })
})

describe('filterSitemapEntries', () => {
  it('drops noindex entries and deduplicates by resolved path', () => {
    const entries = [
      entry('about', 'en'),
      entry('about', 'en'),
      entry('secret', 'en', 'noindex, nofollow'),
    ]
    expect(filterSitemapEntries(entries).map((e) => e.full_slug)).toEqual(['about'])
  })

  it('deduplicates per locale once the set is multilingual', () => {
    const entries = [entry('about', 'en'), entry('about', 'de')]
    expect(filterSitemapEntries(entries)).toHaveLength(2)
  })

  it('collapses same-slug locales when prefixing is disabled', () => {
    const entries = [entry('about', 'en'), entry('about', 'de')]
    expect(filterSitemapEntries(entries, { localePrefix: 'never' })).toHaveLength(1)
  })

  it('filters to a single locale', () => {
    const entries = [entry('about', 'en'), entry('ueber-uns', 'de')]
    expect(filterSitemapEntries(entries, { locale: 'de' }).map((e) => e.full_slug)).toEqual([
      'ueber-uns',
    ])
  })
})
