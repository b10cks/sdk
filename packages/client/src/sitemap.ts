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

/**
 * How a locale segment is applied to an entry's stored `full_slug`. The SDK
 * cannot infer the consuming app's routing, so this mirrors the usual i18n
 * strategies.
 *
 * - `auto` (default) prefixes only when the entries span more than one
 *   `language_iso`. A mono-lingual space is served at `/about`, not `/en/about`,
 *   even though its entries still carry a language.
 * - `always` prefixes every entry.
 * - `never` uses paths as stored, for an app that routes the locale some other
 *   way (a route param, a domain).
 * - `except-default` prefixes every locale but {@link SitemapPathOptions.defaultLocale}.
 */
export type SitemapLocalePrefix = 'auto' | 'always' | 'never' | 'except-default'

export interface SitemapPathOptions {
  localePrefix?: SitemapLocalePrefix
  /** The unprefixed locale under `localePrefix: 'except-default'`. */
  defaultLocale?: string
}

export interface SitemapFilterOptions extends SitemapPathOptions {
  /** Absolute base URL used for deduplication. Without it, paths are compared as strings. */
  siteUrl?: string
  /** Only include entries for this locale (ISO code). */
  locale?: string
}

/**
 * Resolves an entry's path under the chosen prefix strategy. `entries` is only
 * read by `auto`, which needs to know whether the set is multilingual.
 */
function resolveEntryPath(
  entry: IBSitemapEntry,
  options: SitemapPathOptions,
  isMultilingual: boolean
): string {
  const { localePrefix = 'auto', defaultLocale } = options

  const prefix =
    localePrefix === 'always' ||
    (localePrefix === 'auto' && isMultilingual) ||
    (localePrefix === 'except-default' && entry.language_iso !== defaultLocale)

  return prefix
    ? buildLocalizedPath(entry.full_slug, entry.language_iso)
    : buildLocalizedPath(entry.full_slug, null)
}

function hasMultipleLocales(entries: IBSitemapEntry[]): boolean {
  const seen = new Set<string>()
  for (const entry of entries) {
    if (entry.language_iso) seen.add(entry.language_iso)
    if (seen.size > 1) return true
  }
  return false
}

/**
 * Filters sitemap entries by locale, deduplicates by resolved URL, and drops
 * entries whose robots value contains `noindex` or `none` — matching the API's
 * own exclusion, for entries assembled from other sources.
 */
export function filterSitemapEntries(
  entries: IBSitemapEntry[],
  options: SitemapFilterOptions = {}
): IBSitemapEntry[] {
  const { siteUrl, locale } = options
  const seen = new Set<string>()
  const isMultilingual = hasMultipleLocales(entries)

  return entries.filter((entry) => {
    if (locale && entry.language_iso !== locale) return false
    const robots = entry.meta?.robots?.toLowerCase()
    if (robots?.includes('noindex') || robots?.includes('none')) return false

    const path = resolveEntryPath(entry, options, isMultilingual)
    const key = siteUrl ? (toAbsoluteUrl(path, siteUrl) ?? path) : path
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

/**
 * Renders `IBSitemapEntry[]` as a `<urlset>` XML string.
 * Pass `siteUrl` to emit absolute `<loc>` values; without it, relative paths are used.
 *
 * Locale prefixing follows {@link SitemapPathOptions.localePrefix}, which
 * defaults to `auto` — a mono-lingual entry set is emitted unprefixed.
 */
export function renderSitemapXml(
  entries: IBSitemapEntry[],
  siteUrl?: string,
  options: SitemapPathOptions = {}
): string {
  const isMultilingual = hasMultipleLocales(entries)
  const urls = entries
    .map((entry) => {
      const path = resolveEntryPath(entry, options, isMultilingual)
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
