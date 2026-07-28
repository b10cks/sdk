import type { IBBreadcrumbLevel } from './types'

export interface BreadcrumbListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

export interface BreadcrumbListJsonLd {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbListItem[]
}

export interface BreadcrumbJsonLdOptions {
  /** Absolute base URL. Without it, `item` carries the relative path. */
  siteUrl?: string
  /** Drop the current entry from the list. Defaults to `false` — Google expects it. */
  excludeCurrent?: boolean
}

function toAbsoluteUrl(path: string, siteUrl?: string): string {
  if (!siteUrl) return path
  try {
    return new URL(path, siteUrl).toString()
  } catch {
    return path
  }
}

/**
 * Renders a trail as a schema.org `BreadcrumbList`, ready to be serialized into
 * an `application/ld+json` script tag.
 *
 * `position` numbers the emitted items consecutively — unlike a level's `depth`,
 * which is its position in the content tree and may skip a dropped ancestor.
 */
export function breadcrumbJsonLd<T>(
  levels: IBBreadcrumbLevel<T>[],
  options: BreadcrumbJsonLdOptions = {}
): BreadcrumbListJsonLd {
  const { siteUrl, excludeCurrent = false } = options
  const items = excludeCurrent ? levels.filter((level) => !level.is_current) : levels

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((level, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: level.name,
      item: toAbsoluteUrl(level.path, siteUrl),
    })),
  }
}
