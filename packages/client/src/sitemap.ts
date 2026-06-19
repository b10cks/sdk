import type { IBSitemapEntry } from './types'

export function normalizePathSegment(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/^\/+|\/+$/g, '')
}

/**
 * Combines a b10cks `full_slug` and `language_iso` into a rooted, locale-prefixed path.
 *
 * - The slug `home` is treated as the root (`/` or `/<locale>`).
 * - Slugs that already start with the locale prefix are not double-prefixed.
 */
export function buildLocalizedPath(
  fullSlug: string | null | undefined,
  languageIso: string | null | undefined
): string {
  const slug = normalizePathSegment(fullSlug)
  const locale = normalizePathSegment(languageIso)

  if (!locale) {
    return slug && slug !== 'home' ? `/${slug}` : '/'
  }

  if (!slug || slug === 'home') {
    return `/${locale}`
  }

  const localePrefix = `${locale}/`
  if (slug === locale || slug.startsWith(localePrefix)) {
    return `/${slug}`
  }

  return `/${locale}/${slug}`
}

function toAbsoluteUrl(path: string, siteUrl?: string): string | null {
  if (!siteUrl) return null
  try {
    return new URL(path, siteUrl).toString()
  } catch {
    return null
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export interface SitemapFilterOptions {
  /** Absolute base URL used for deduplication. Without it, paths are compared as strings. */
  siteUrl?: string
  /** Only include entries for this locale (ISO code). */
  locale?: string
}

/**
 * Filters sitemap entries by locale, deduplicates by resolved URL, and drops `noindex` entries.
 */
export function filterSitemapEntries(
  entries: IBSitemapEntry[],
  options: SitemapFilterOptions = {}
): IBSitemapEntry[] {
  const { siteUrl, locale } = options
  const seen = new Set<string>()

  return entries.filter((entry) => {
    if (locale && entry.language_iso !== locale) return false
    if (entry.meta?.robots?.toLowerCase().includes('noindex')) return false

    const path = buildLocalizedPath(entry.full_slug, entry.language_iso)
    const key = siteUrl ? (toAbsoluteUrl(path, siteUrl) ?? path) : path
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

/**
 * Renders `IBSitemapEntry[]` as a `<urlset>` XML string.
 * Pass `siteUrl` to emit absolute `<loc>` values; without it, relative paths are used.
 */
export function renderSitemapXml(entries: IBSitemapEntry[], siteUrl?: string): string {
  const urls = entries
    .map((entry) => {
      const path = buildLocalizedPath(entry.full_slug, entry.language_iso)
      const loc = siteUrl ? toAbsoluteUrl(path, siteUrl) : path
      if (!loc) return ''
      const lines = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`]
      if (entry.published_at) lines.push(`    <lastmod>${escapeXml(entry.published_at)}</lastmod>`)
      lines.push('  </url>')
      return lines.join('\n')
    })
    .filter(Boolean)
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
  ].join('\n')
}

/**
 * Renders a list of sitemap paths as a `<sitemapindex>` XML string.
 */
export function renderSitemapIndex(paths: string[], siteUrl?: string): string {
  const sitemaps = paths
    .map((path) => {
      const loc = siteUrl ? toAbsoluteUrl(path, siteUrl) : path
      if (!loc) return ''
      return ['  <sitemap>', `    <loc>${escapeXml(loc)}</loc>`, '  </sitemap>'].join('\n')
    })
    .filter(Boolean)
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    sitemaps,
    '</sitemapindex>',
  ].join('\n')
}
