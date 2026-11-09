import { sanitizeUrl, type UrlPolicy } from '@b10cks/richtext'

import type { B10cksLink, IBContent } from './types'

export type RootBlock<T> = T & { id: string; block: string }

/**
 * Flatten a content entry into a renderable root block.
 *
 * An entry's `content` object carries `block` but not `id` — the id lives on the
 * entry. Rendering `entry.content` directly therefore yields a root block the
 * visual editor cannot address: `v-editable` no-ops on it, and the editor's
 * root-level `CONTENT_UPDATE` (sent as `{ id: entryId, … }`) matches nothing.
 * Use this helper to carry the entry id into the tree:
 *
 * ```ts
 * const block = toRootBlock(entry) // { ...entry.content, id, block }
 * ```
 */
export function toRootBlock<T extends Record<string, unknown>>(entry: IBContent<T>): RootBlock<T>
export function toRootBlock<T extends Record<string, unknown>>(
  entry: IBContent<T> | null | undefined
): RootBlock<T> | null
export function toRootBlock<T extends Record<string, unknown>>(
  entry: IBContent<T> | null | undefined
): RootBlock<T> | null {
  if (!entry) {
    return null
  }

  const content = (entry.content ?? {}) as T & { block?: string }

  return {
    ...content,
    id: entry.id,
    block: content.block ?? entry.block,
  } as RootBlock<T>
}

/**
 * The id that references to this entry hold: the default-language row id.
 *
 * Every translation is its own row with its own id, while reference fields,
 * `link.content` and `parent_id` point at the default-language row. Use this to
 * match an entry of any language against such a reference. It reads
 * `canonical_id` and, on API deployments without it, the default-language
 * sibling in `translations`. Without either it returns `entry.id`, which is
 * only right for an entry in the default language.
 */
export function canonicalId(
  entry: Pick<IBContent, 'id' | 'canonical_id' | 'translations'>,
  defaultLanguage?: string
): string {
  if (entry.canonical_id) return entry.canonical_id
  const sibling = defaultLanguage
    ? entry.translations?.find((translation) => translation.language_iso === defaultLanguage)
    : undefined
  return sibling?.id ?? entry.id
}

export interface B10cksLinkResolved {
  href: string
  target: string
}

/**
 * Resolves a B10cksLink value to a plain { href, target } object.
 *
 * - `'email'` links produce a `mailto:` href with optional subject/body/cc/bcc query params.
 * - `'url'` and `'internal'` links use the stored `url` field, then append `params` as a query
 *   string and `anchor` as a `#fragment` (`/page?x=1#01kh…`). An href that already carries a
 *   fragment keeps it.
 * - `'asset'` links cannot be resolved to a URL without the asset record — returns `undefined`.
 * - Hrefs with a scheme outside `allowedSchemes` (`javascript:` and the like) become `'#'`, the
 *   same policy `renderRichText` applies to rich text links.
 * - Locale prefixing and router integration are intentionally left to the caller.
 */
export function resolveB10cksLink(
  link: B10cksLink | undefined | null,
  policy: UrlPolicy = {}
): B10cksLinkResolved | undefined {
  if (!link) return undefined

  if (link.type === 'email') {
    const params = new URLSearchParams()
    if (link.subject) params.set('subject', link.subject)
    if (link.body) params.set('body', link.body)
    if (link.cc) params.set('cc', link.cc)
    if (link.bcc) params.set('bcc', link.bcc)
    const query = params.toString()
    return { href: `mailto:${link.email}${query ? `?${query}` : ''}`, target: '_self' }
  }

  if (link.type === 'asset') {
    return undefined
  }

  // 'url' and 'internal' share url + target + optional params and anchor
  const target = link.target ?? '_self'
  let href = typeof link.url === 'string' ? link.url.trimEnd() : ''

  const query = link.params ? new URLSearchParams(link.params).toString() : ''
  if (query) {
    const hashIndex = href.indexOf('#')
    const base = hashIndex === -1 ? href : href.slice(0, hashIndex)
    const hash = hashIndex === -1 ? '' : href.slice(hashIndex)
    href = `${base}${base.includes('?') ? '&' : '?'}${query}${hash}`
  }

  if (link.anchor && !href.includes('#')) {
    href = `${href}#${encodeURIComponent(link.anchor)}`
  }

  return { href: sanitizeUrl(href, policy), target }
}

/**
 * Attributes that make a block addressable as a link anchor: `{ id: block.id }`.
 *
 * `v-editable` (Vue) and `B10cksComponent` (React) set the id already. Spread this onto the
 * root element of blocks rendered without them. Block ids are ULIDs and can start with a
 * digit, so look them up with `getElementById` (or `CSS.escape` for `querySelector`).
 */
export function blockAnchorAttrs(block: { id?: string | null } | null | undefined): {
  id?: string
} {
  return block?.id ? { id: block.id } : {}
}
