import type { RichTextHtmlOptions, RichTextInternalLinkAttrs } from './index'

/** Default schemes allowed in link/image URLs. */
export const DEFAULT_ALLOWED_SCHEMES: readonly string[] = ['http', 'https', 'mailto', 'tel']

/** Which URL schemes are safe. Shared by the renderer, the preview editor and link helpers. */
export interface UrlPolicy {
  /** Schemes without the trailing colon. Defaults to {@link DEFAULT_ALLOWED_SCHEMES}. */
  allowedSchemes?: readonly string[]
}

const URL_SCHEME_RE = /^([a-z][a-z0-9+.-]*):/

/**
 * Whether `url` is a string with an allowed scheme, or a relative, anchor, query or
 * protocol-relative URL. Anything else, including non-strings, is unsafe.
 */
export function isSafeUrl(url: unknown, policy: UrlPolicy = {}): url is string {
  if (typeof url !== 'string') return false
  // Browsers ignore control characters and whitespace when parsing the URL
  // scheme (e.g. `java\nscript:`), so strip anything at or below U+0020 before
  // matching. Done via a code-point filter to avoid a control-char regex.
  let stripped = ''
  for (const char of url) {
    if (char.charCodeAt(0) > 0x20) stripped += char
  }
  const scheme = URL_SCHEME_RE.exec(stripped.toLowerCase())?.[1]
  if (!scheme) return true
  return (policy.allowedSchemes ?? DEFAULT_ALLOWED_SCHEMES).includes(scheme)
}

/** `url` when it is safe by {@link isSafeUrl}, otherwise `'#'`. */
export function sanitizeUrl(url: unknown, policy: UrlPolicy = {}): string {
  return isSafeUrl(url, policy) ? url : '#'
}

/**
 * Appends `#anchor` to a resolved href. Leaves hrefs that already carry a fragment alone, which
 * covers handlers that add the anchor themselves and the `'#'` placeholder for unresolved links.
 */
function withFragment(href: string, anchor: string | undefined): string {
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
  const handled = options.internalLinkHandler?.(linkAttrs)
  const resolvedHref = typeof handled === 'string' ? handled : defaultHref
  const attrs: Record<string, string | true> = {
    href: sanitizeUrl(withFragment(resolvedHref, text(linkAttrs.anchor)), options),
    // data-type="internal" matches CMS output; data-b10cks-internal-link kept for SDK consumers
    'data-type': 'internal',
    'data-b10cks-internal-link': true,
  }
  // CMS attrs
  const content = text(linkAttrs.content)
  const anchor = text(linkAttrs.anchor)
  if (content) attrs['data-content'] = content
  if (anchor) attrs['data-anchor'] = anchor
  // legacy attrs
  for (const key of ['target', 'rel', 'title'] as const) {
    const value = text(linkAttrs[key])
    if (value) attrs[key] = value
  }
  return attrs
}

/** A non-empty string attribute, or undefined for anything else stored in the document. */
export function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
