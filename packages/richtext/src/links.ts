import type { RichTextHtmlOptions, RichTextInternalLinkAttrs } from './index'

/** Default schemes allowed in link/image URLs. */
export const DEFAULT_ALLOWED_SCHEMES: readonly string[] = ['http', 'https', 'mailto', 'tel']

const URL_SCHEME_RE = /^([a-z][a-z0-9+.-]*):/

export function sanitizeUrl(url: string, options: RichTextHtmlOptions): string {
  // Browsers ignore control characters and whitespace when parsing the URL
  // scheme (e.g. `java\nscript:`), so strip anything at or below U+0020 before
  // matching. Done via a code-point filter to avoid a control-char regex.
  let stripped = ''
  for (const char of url) {
    if (char.charCodeAt(0) > 0x20) stripped += char
  }
  const normalized = stripped.toLowerCase()
  const scheme = URL_SCHEME_RE.exec(normalized)?.[1]
  if (!scheme) return url // relative, anchor, query or protocol-relative URL
  const allowed = options.allowedSchemes ?? DEFAULT_ALLOWED_SCHEMES
  return allowed.includes(scheme) ? url : '#'
}

/**
 * Appends `#anchor` to a resolved href. Leaves hrefs that already carry a fragment alone, which
 * covers handlers that add the anchor themselves and the `'#'` placeholder for unresolved links.
 */
function withFragment(href: string, anchor: string | null | undefined): string {
  if (!anchor || !href || href.includes('#')) return href
  return `${href}#${encodeURIComponent(anchor)}`
}

/** The `<a>` attributes of an internal link, shared by the renderer and the preview editor. */
export function internalLinkAttributes(
  linkAttrs: RichTextInternalLinkAttrs,
  options: RichTextHtmlOptions
): Record<string, string | true> {
  // CMS stores { content, anchor }; legacy format used { url, href, … }
  const defaultHref =
    typeof linkAttrs.url === 'string' && linkAttrs.url.length > 0
      ? linkAttrs.url
      : typeof linkAttrs.href === 'string' && linkAttrs.href.length > 0
        ? linkAttrs.href
        : '#'
  const resolvedHref = options.internalLinkHandler
    ? (options.internalLinkHandler(linkAttrs) ?? defaultHref)
    : defaultHref
  const attrs: Record<string, string | true> = {
    href: sanitizeUrl(withFragment(resolvedHref, linkAttrs.anchor), options),
    // data-type="internal" matches CMS output; data-b10cks-internal-link kept for SDK consumers
    'data-type': 'internal',
    'data-b10cks-internal-link': true,
  }
  // CMS attrs
  if (linkAttrs.content) attrs['data-content'] = linkAttrs.content
  if (linkAttrs.anchor) attrs['data-anchor'] = linkAttrs.anchor
  // legacy attrs
  if (linkAttrs.target) attrs.target = linkAttrs.target
  if (linkAttrs.rel) attrs.rel = linkAttrs.rel
  if (linkAttrs.title) attrs.title = linkAttrs.title
  return attrs
}
