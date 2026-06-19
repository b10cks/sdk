// ─── Types ───────────────────────────────────────────────────────────────────

export interface RichTextDocument {
  type: string
  content?: RichTextDocument[]
  text?: string
  marks?: RichTextMark[]
  attrs?: Record<string, unknown>
}

interface RichTextMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface RichTextInternalLinkAttrs {
  url?: string | null
  href?: string | null
  title?: string | null
  target?: string | null
  rel?: string | null
  anchor?: string | null
  content?: string | null
  cached_url?: string | null
  linktype?: string | null
  uuid?: string | null
  id?: string | null
  [key: string]: unknown
}

/** @deprecated Use RichTextInternalLinkAttrs */
export type RichTextLinkAttrs = RichTextInternalLinkAttrs

export type RichTextInternalLinkHandler = (
  attrs: RichTextInternalLinkAttrs
) => string | null | undefined

/**
 * Resolves a placeholder token to its real value.
 * Receives the token's `key` (e.g. `"companyName"`) and `label` (the display
 * hint shown in the editor, e.g. `"{companyName}"`).
 * Return the replacement string, or null/undefined to leave the token as-is
 * (rendered as a `<span data-type="placeholder-token">` for client-side use).
 */
export type RichTextPlaceholderHandler = (
  key: string,
  label: string
) => string | null | undefined

export interface RichTextHtmlOptions {
  internalLinkHandler?: RichTextInternalLinkHandler
  placeholderHandler?: RichTextPlaceholderHandler
}

export interface RichTextTextOptions {
  blockSeparator?: string
  placeholderHandler?: RichTextPlaceholderHandler
}

export interface RichTextRenderer {
  render: (document: RichTextDocument | null | undefined) => string
}

export interface RichTextTextRenderer {
  render: (document: RichTextDocument | null | undefined) => string
}

// ─── Legacy extension options (no-op, kept for API compatibility) ─────────────

export interface RichTextExtensionOptions {
  /**
   * No longer used. Kept for backwards-compatibility with call sites that
   * previously passed custom TipTap extensions. The custom renderer ignores
   * this field.
   */
  extensions?: unknown
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildAttrs(attrs: Record<string, unknown>): string {
  let result = ''
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue
    if (value === true) {
      result += ` ${key}`
    } else {
      result += ` ${key}="${escapeHtml(String(value))}"`
    }
  }
  return result
}

function tag(
  name: string,
  inner: string,
  attrs: Record<string, unknown> = {}
): string {
  return `<${name}${buildAttrs(attrs)}>${inner}</${name}>`
}

function voidTag(name: string, attrs: Record<string, unknown> = {}): string {
  return `<${name}${buildAttrs(attrs)}>`
}

// ─── Mark rendering ───────────────────────────────────────────────────────────

function applyMark(
  mark: RichTextMark,
  inner: string,
  options: RichTextHtmlOptions
): string {
  const a = mark.attrs ?? {}
  switch (mark.type) {
    case 'bold':
      return tag('strong', inner)
    case 'italic':
      return tag('em', inner)
    case 'strike':
      return tag('s', inner)
    case 'underline':
      return tag('u', inner)
    case 'code':
      return tag('code', inner)
    case 'link': {
      const href = ((a.href || a.url || '#') as string)
      const linkAttrs: Record<string, unknown> = { href }
      if (a.target) linkAttrs.target = a.target
      if (a.rel) linkAttrs.rel = a.rel
      if (a.title) linkAttrs.title = a.title
      return tag('a', inner, linkAttrs)
    }
    case 'internalLink': {
      const linkAttrs = a as RichTextInternalLinkAttrs
      // CMS stores { content, anchor }; legacy format used { url, href, … }
      const defaultHref =
        typeof linkAttrs.url === 'string' && linkAttrs.url.length > 0
          ? linkAttrs.url
          : typeof linkAttrs.href === 'string' && linkAttrs.href.length > 0
            ? linkAttrs.href
            : '#'
      const href = options.internalLinkHandler
        ? (options.internalLinkHandler(linkAttrs) ?? defaultHref)
        : defaultHref
      const elAttrs: Record<string, unknown> = {
        href,
        // data-type="internal" matches CMS output; data-b10cks-internal-link kept for SDK consumers
        'data-type': 'internal',
        'data-b10cks-internal-link': true,
      }
      // CMS attrs
      if (linkAttrs.content) elAttrs['data-content'] = linkAttrs.content
      if (linkAttrs.anchor) elAttrs['data-anchor'] = linkAttrs.anchor
      // legacy attrs
      if (linkAttrs.target) elAttrs.target = linkAttrs.target
      if (linkAttrs.rel) elAttrs.rel = linkAttrs.rel
      if (linkAttrs.title) elAttrs.title = linkAttrs.title
      return tag('a', inner, elAttrs)
    }
    case 'textClass': {
      const cls = a.class as string | null | undefined
      return cls ? tag('span', inner, { class: cls }) : inner
    }
    default:
      return inner
  }
}

function renderText(
  text: string,
  marks: RichTextMark[] | undefined,
  options: RichTextHtmlOptions
): string {
  let result = escapeHtml(text)
  if (!marks || marks.length === 0) return result
  // Apply marks innermost-first (last in array = innermost)
  for (let i = marks.length - 1; i >= 0; i--) {
    const mark = marks[i]
    if (mark) result = applyMark(mark, result, options)
  }
  return result
}

// ─── Node rendering ───────────────────────────────────────────────────────────

function renderChildren(
  nodes: RichTextDocument[] | undefined,
  options: RichTextHtmlOptions
): string {
  if (!nodes) return ''
  return nodes.map((n) => renderNode(n, options)).join('')
}

function renderNode(node: RichTextDocument, options: RichTextHtmlOptions): string {
  const a = node.attrs ?? {}

  switch (node.type) {
    case 'doc':
      return renderChildren(node.content, options)

    case 'paragraph':
      return tag('p', renderChildren(node.content, options))

    case 'text':
      return renderText(node.text ?? '', node.marks, options)

    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(a.level) || 1))
      const h = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return tag(h, renderChildren(node.content, options))
    }

    case 'blockquote':
      return tag('blockquote', renderChildren(node.content, options))

    case 'codeBlock': {
      const langAttr: Record<string, unknown> = {}
      if (a.language) langAttr['data-language'] = a.language
      return tag('pre', tag('code', renderChildren(node.content, options), langAttr))
    }

    case 'bulletList':
      return tag('ul', renderChildren(node.content, options))

    case 'orderedList': {
      const listAttrs: Record<string, unknown> = {}
      if (a.start && a.start !== 1) listAttrs.start = a.start
      return tag('ol', renderChildren(node.content, options), listAttrs)
    }

    case 'listItem':
      return tag('li', renderChildren(node.content, options))

    case 'hardBreak':
      return voidTag('br')

    case 'horizontalRule':
      return voidTag('hr')

    case 'image': {
      const imgAttrs: Record<string, unknown> = { src: a.src ?? '' }
      if (a.alt) imgAttrs.alt = a.alt
      if (a.title) imgAttrs.title = a.title
      return voidTag('img', imgAttrs)
    }

    case 'table':
      return tag('table', renderChildren(node.content, options))

    case 'tableRow':
      return tag('tr', renderChildren(node.content, options))

    case 'tableHeader': {
      const cellAttrs: Record<string, unknown> = {}
      if (a.colspan && a.colspan !== 1) cellAttrs.colspan = a.colspan
      if (a.rowspan && a.rowspan !== 1) cellAttrs.rowspan = a.rowspan
      return tag('th', renderChildren(node.content, options), cellAttrs)
    }

    case 'tableCell': {
      const cellAttrs: Record<string, unknown> = {}
      if (a.colspan && a.colspan !== 1) cellAttrs.colspan = a.colspan
      if (a.rowspan && a.rowspan !== 1) cellAttrs.rowspan = a.rowspan
      return tag('td', renderChildren(node.content, options), cellAttrs)
    }

    // Inline atom inserted by the CMS placeholder-token extension
    case 'placeholderToken': {
      const key = (a.key ?? '') as string
      const label = (a.label ?? '') as string
      if (options.placeholderHandler) {
        const resolved = options.placeholderHandler(key, label)
        if (resolved != null) return escapeHtml(resolved)
      }
      const tokenAttrs: Record<string, unknown> = { 'data-type': 'placeholder-token' }
      if (key) tokenAttrs['data-key'] = key
      if (label) tokenAttrs['data-label'] = label
      return tag('span', '', tokenAttrs)
    }

    default:
      return renderChildren(node.content, options)
  }
}

// ─── Block node set (used by text renderer) ──────────────────────────────────

const BLOCK_NODES = new Set([
  'doc',
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'listItem',
  'horizontalRule',
  'table',
  'tableRow',
  'tableHeader',
  'tableCell',
])

function collectText(
  node: RichTextDocument,
  parts: string[],
  separator: string,
  placeholderHandler: RichTextPlaceholderHandler | undefined
): void {
  if (node.type === 'text') {
    parts.push(node.text ?? '')
    return
  }
  if (node.type === 'hardBreak') {
    parts.push('\n')
    return
  }
  if (node.type === 'horizontalRule') {
    parts.push(separator)
    return
  }
  if (node.type === 'placeholderToken') {
    const key = ((node.attrs?.key ?? '') as string)
    const label = ((node.attrs?.label ?? '') as string)
    if (placeholderHandler) {
      const resolved = placeholderHandler(key, label)
      if (resolved != null) { parts.push(resolved); return }
    }
    // No handler — emit nothing (it's an empty atom in plain text)
    return
  }

  const isBlock = BLOCK_NODES.has(node.type)
  const childParts: string[] = []

  for (const child of node.content ?? []) {
    collectText(child, childParts, separator, placeholderHandler)
  }

  if (isBlock && childParts.length > 0) {
    // Trim trailing separators from children before joining so every block
    // level contributes exactly one separator to its parent, and the final
    // trim in renderRichTextAsText reliably removes the last one.
    while (childParts.length > 0 && childParts[childParts.length - 1] === separator) {
      childParts.pop()
    }
    if (childParts.length > 0) {
      parts.push(childParts.join(''))
      parts.push(separator)
    }
  } else {
    for (const p of childParts) parts.push(p)
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

const EMPTY_DOCUMENT: RichTextDocument = { type: 'doc', content: [] }

/**
 * @deprecated Provided for backwards-compatibility. The custom renderer does
 * not use TipTap extensions; pass {@link RichTextHtmlOptions} instead.
 */
export function createB10cksRichTextExtensions(
  _options: Pick<RichTextHtmlOptions, 'internalLinkHandler'> = {}
): unknown[] {
  return []
}

export function renderRichText(
  document: RichTextDocument | null | undefined,
  options: RichTextHtmlOptions & RichTextExtensionOptions = {}
): string {
  return renderNode(document ?? EMPTY_DOCUMENT, options)
}

export const renderRichTextHtml = renderRichText

export function createRichTextRenderer(
  options: RichTextHtmlOptions & RichTextExtensionOptions = {}
): RichTextRenderer {
  return {
    render(document) {
      return renderRichText(document, options)
    },
  }
}

export const createRichTextHtmlRenderer = createRichTextRenderer

export function renderRichTextAsText(
  document: RichTextDocument | null | undefined,
  options: RichTextTextOptions & RichTextExtensionOptions = {}
): string {
  const separator = options.blockSeparator ?? '\n\n'
  const parts: string[] = []
  collectText(document ?? EMPTY_DOCUMENT, parts, separator, options.placeholderHandler)
  // Remove trailing separator
  while (parts.length > 0 && parts[parts.length - 1] === separator) {
    parts.pop()
  }
  return parts.join('')
}

export function createRichTextTextRenderer(
  options: RichTextTextOptions & RichTextExtensionOptions = {}
): RichTextTextRenderer {
  return {
    render(document) {
      return renderRichTextAsText(document, options)
    },
  }
}
