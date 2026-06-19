import type { B10cksLink } from './types'

export interface B10cksLinkResolved {
  href: string
  target: string
}

/**
 * Resolves a B10cksLink value to a plain { href, target } object.
 *
 * - `'email'` links produce a `mailto:` href with optional subject/body/cc/bcc query params.
 * - `'url'` and `'internal'` links use the stored `url` field; an `anchor` is appended as a
 *   hash fragment when present.
 * - `'asset'` links cannot be resolved to a URL without the asset record — returns `undefined`.
 * - Locale prefixing and router integration are intentionally left to the caller.
 */
export function resolveB10cksLink(
  link: B10cksLink | undefined | null
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

  // 'url' and 'internal' share url + target + optional anchor
  const target = link.target ?? '_self'
  let href = link.url ?? ''
  if ('anchor' in link && link.anchor) {
    href = `${href.trimEnd()}#${link.anchor}`
  }

  return { href, target }
}
