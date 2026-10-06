import { internalLinkAttributes, sanitizeUrl, text as stringAttr } from './links'

export { DEFAULT_ALLOWED_SCHEMES, isSafeUrl, sanitizeUrl, type UrlPolicy } from './links'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RichTextDocument {
  type: string
  content?: RichTextDocument[]
  text?: string
  marks?: RichTextMark[]
  attrs?: Record<string, unknown>
}

export interface RichTextMark {
  type: string
  attrs?: Record<string, unknown>
}

/** Node types the renderer knows. Documents can carry others, e.g. from CMS extensions. */
export type RichTextNodeType =
  | 'doc'
  | 'paragraph'
  | 'text'
  | 'heading'
  | 'blockquote'
  | 'codeBlock'
  | 'bulletList'
  | 'orderedList'
  | 'listItem'
  | 'hardBreak'
  | 'horizontalRule'
  | 'image'
  | 'table'
  | 'tableRow'
  | 'tableHeader'
  | 'tableCell'
  | 'placeholderToken'

/** Mark types the renderer knows. */
export type RichTextMarkType =
  | 'bold'
  | 'italic'
  | 'strike'
  | 'underline'
  | 'code'
  | 'link'
  | 'internalLink'
  | 'textClass'

export interface RichTextNodeRenderContext {
  node: RichTextDocument
  /** The node's attributes, `{}` when it has none. */
  attrs: Record<string, unknown>
  /** The node's children, already rendered and escaped. Empty for text and atoms. */
  children: string
  /** The HTML the built-in renderer produces for this node. */
  renderDefault: () => string
}

export interface RichTextMarkRenderContext {
  mark: RichTextMark
  /** The mark's attributes, `{}` when it has none. */
  attrs: Record<string, unknown>
  /** The marked content, already rendered and escaped. */
  children: string
  /** The HTML the built-in renderer produces for this mark. */
  renderDefault: () => string
}

/**
 * Renders one node or mark. Return `null` or `undefined` to fall back to the built-in output.
 *
 * Renderers are trusted code: the returned string goes into the page as HTML, unescaped. Escape
 * every value taken from the document with {@link escapeHtml}, and pass URLs through
 * {@link sanitizeUrl}. `children` and `renderDefault()` are already safe.
 */
export type RichTextNodeRenderer = (context: RichTextNodeRenderContext) => string | null | undefined
export type RichTextMarkRenderer = (context: RichTextMarkRenderContext) => string | null | undefined

/** Known types autocomplete; any other type string is accepted too. */
type RendererMap<Type extends string, Renderer> = { [K in Type | (string & {})]?: Renderer }

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
export type RichTextPlaceholderHandler = (key: string, label: string) => string | null | undefined

export interface RichTextHtmlOptions {
  internalLinkHandler?: RichTextInternalLinkHandler
  placeholderHandler?: RichTextPlaceholderHandler
  /**
   * URL schemes (without the trailing colon) permitted in link `href` and
   * image `src` attributes. URLs with any other scheme are replaced with `'#'`
   * to prevent script-injecting URLs (e.g. `javascript:`) stored in CMS
   * content from executing. Relative URLs are always allowed.
   *
   * Defaults to {@link DEFAULT_ALLOWED_SCHEMES}. To additionally allow
   * `javascript:` URLs, pass
   * `[...DEFAULT_ALLOWED_SCHEMES, 'javascript']`.
   */
  allowedSchemes?: readonly string[]
  /**
   * Custom HTML per node type, e.g. responsive images, heading anchors or embeds. Unknown node
   * types render their children unless a renderer handles them. See {@link RichTextNodeRenderer}
   * for the escaping contract. The in-place preview editor shows the built-in markup while a
   * field is edited.
   */
  nodes?: RendererMap<RichTextNodeType, RichTextNodeRenderer>
  /** Custom HTML per mark type. See {@link RichTextNodeRenderer} for the escaping contract. */
  marks?: RendererMap<RichTextMarkType, RichTextMarkRenderer>
}

export interface RichTextTextOptions {
  blockSeparator?: string
  placeholderHandler?: RichTextPlaceholderHandler
}

/** Features a rich text field can switch off in the CMS field settings. */
export type RichTextFeature =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'codeBlock'
  | 'horizontalRule'
  | 'link'
  | 'internalLink'
  | 'table'

export type RichTextHeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p'

/** How a rich text field is configured in the CMS. */
export interface RichTextFieldConfig {
  /** A feature is on unless set to `false`, like in the CMS. */
  features?: Partial<Record<RichTextFeature, boolean>>
  /** Block formats the toolbar offers, in order. */
  headingLevels?: RichTextHeadingLevel[]
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

/** Escape text for HTML content and double-quoted attribute values. */
export function escapeHtml(str: string): string {
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

function tag(name: string, inner: string, attrs: Record<string, unknown> = {}): string {
  return `<${name}${buildAttrs(attrs)}>${inner}</${name}>`
}

function voidTag(name: string, attrs: Record<string, unknown> = {}): string {
  return `<${name}${buildAttrs(attrs)}>`
}

/**
 * Extract a `class` attribute from a node's attrs. The CMS editor stores a
 * per-node class name (e.g. a configurable list style) under `className`; we
 * also accept `class` for hand-authored documents. Returns an empty object when
 * neither is present so existing documents render unchanged.
 */
function classAttr(a: Record<string, unknown>): Record<string, unknown> {
  const cls = a.className ?? a.class
  return typeof cls === 'string' && cls.length > 0 ? { class: cls } : {}
}

// ─── Input guards ─────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A custom renderer registered for `type`, ignoring inherited object keys. */
function customRenderer<R>(
  renderers: { [type: string]: R | undefined } | undefined,
  type: string
): R | undefined {
  return renderers && Object.hasOwn(renderers, type) ? renderers[type] : undefined
}

function validMarks(marks: unknown): RichTextMark[] {
  if (!Array.isArray(marks)) return []
  return marks.filter(
    (mark): mark is RichTextMark => isRecord(mark) && typeof mark.type === 'string'
  )
}

// ─── Mark rendering ───────────────────────────────────────────────────────────

function defaultMark(
  type: string,
  a: Record<string, unknown>,
  inner: string,
  options: RichTextHtmlOptions
): string {
  switch (type) {
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
      const linkAttrs: Record<string, unknown> = {
        href: sanitizeUrl(a.href || a.url || '#', options),
        target: stringAttr(a.target),
        rel: stringAttr(a.rel),
        title: stringAttr(a.title),
      }
      return tag('a', inner, linkAttrs)
    }
    case 'internalLink':
      return tag('a', inner, internalLinkAttributes(a, options))
    case 'textClass': {
      const cls = stringAttr(a.class)
      return cls ? tag('span', inner, { class: cls }) : inner
    }
    default:
      return inner
  }
}

function applyMark(mark: RichTextMark, inner: string, options: RichTextHtmlOptions): string {
  const attrs = isRecord(mark.attrs) ? mark.attrs : {}
  const renderDefault = () => defaultMark(mark.type, attrs, inner, options)
  const custom = customRenderer(options.marks, mark.type)
  return custom?.({ mark, attrs, children: inner, renderDefault }) ?? renderDefault()
}

function renderText(text: string, marks: unknown, options: RichTextHtmlOptions): string {
  let result = escapeHtml(text)
  const valid = validMarks(marks)
  // Apply marks innermost-first (last in array = innermost)
  for (let i = valid.length - 1; i >= 0; i--) {
    const mark = valid[i]
    if (mark) result = applyMark(mark, result, options)
  }
  return result
}

// ─── Node rendering ───────────────────────────────────────────────────────────

function renderChildren(nodes: unknown, options: RichTextHtmlOptions): string {
  if (!Array.isArray(nodes)) return ''
  return nodes.map((n) => renderNode(n, options)).join('')
}

function cellAttrs(a: Record<string, unknown>): Record<string, unknown> {
  const attrs: Record<string, unknown> = {}
  if (a.colspan && a.colspan !== 1) attrs.colspan = a.colspan
  if (a.rowspan && a.rowspan !== 1) attrs.rowspan = a.rowspan
  return attrs
}

function renderNode(input: unknown, options: RichTextHtmlOptions): string {
  if (!isRecord(input)) return ''
  const node = input as unknown as RichTextDocument
  const type = typeof input.type === 'string' ? input.type : ''
  const attrs = isRecord(input.attrs) ? input.attrs : {}
  const children = renderChildren(input.content, options)
  const renderDefault = () => defaultNode(type, input, attrs, children, options)
  const custom = customRenderer(options.nodes, type)
  return custom?.({ node, attrs, children, renderDefault }) ?? renderDefault()
}

function defaultNode(
  type: string,
  node: Record<string, unknown>,
  a: Record<string, unknown>,
  children: string,
  options: RichTextHtmlOptions
): string {
  switch (type) {
    case 'doc':
      return children

    case 'paragraph':
      return tag('p', children)

    case 'text':
      return renderText(typeof node.text === 'string' ? node.text : '', node.marks, options)

    case 'heading': {
      const level = Math.min(6, Math.max(1, Number(a.level) || 1))
      return tag(`h${level}`, children)
    }

    case 'blockquote':
      return tag('blockquote', children)

    case 'codeBlock':
      return tag('pre', tag('code', children, { 'data-language': stringAttr(a.language) }))

    case 'bulletList':
      return tag('ul', children, classAttr(a))

    case 'orderedList': {
      const listAttrs: Record<string, unknown> = { ...classAttr(a) }
      if (a.start && a.start !== 1) listAttrs.start = a.start
      return tag('ol', children, listAttrs)
    }

    case 'listItem':
      return tag('li', children, classAttr(a))

    case 'hardBreak':
      return voidTag('br')

    case 'horizontalRule':
      return voidTag('hr')

    case 'image':
      return voidTag('img', {
        src: sanitizeUrl(a.src ?? '', options),
        alt: stringAttr(a.alt),
        title: stringAttr(a.title),
      })

    case 'table':
      return tag('table', children)

    case 'tableRow':
      return tag('tr', children)

    case 'tableHeader':
      return tag('th', children, cellAttrs(a))

    case 'tableCell':
      return tag('td', children, cellAttrs(a))

    // Inline atom inserted by the CMS placeholder-token extension
    case 'placeholderToken': {
      const key = stringAttr(a.key) ?? ''
      const label = stringAttr(a.label) ?? ''
      const resolved = options.placeholderHandler?.(key, label)
      if (typeof resolved === 'string') return escapeHtml(resolved)
      return tag('span', '', {
        'data-type': 'placeholder-token',
        'data-key': key || undefined,
        'data-label': label || undefined,
      })
    }

    default:
      return children
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
  node: unknown,
  parts: string[],
  separator: string,
  placeholderHandler: RichTextPlaceholderHandler | undefined
): void {
  if (!isRecord(node)) return
  const type = typeof node.type === 'string' ? node.type : ''
  if (type === 'text') {
    parts.push(typeof node.text === 'string' ? node.text : '')
    return
  }
  if (type === 'hardBreak') {
    parts.push('\n')
    return
  }
  if (type === 'horizontalRule') {
    parts.push(separator)
    return
  }
  if (type === 'placeholderToken') {
    const attrs = isRecord(node.attrs) ? node.attrs : {}
    const resolved = placeholderHandler?.(
      stringAttr(attrs.key) ?? '',
      stringAttr(attrs.label) ?? ''
    )
    // No handler or no value: emit nothing (it's an empty atom in plain text)
    if (typeof resolved === 'string') parts.push(resolved)
    return
  }

  const isBlock = BLOCK_NODES.has(type)
  const childParts: string[] = []

  for (const child of Array.isArray(node.content) ? node.content : []) {
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

/**
 * Container nodes that carry no content of their own. Everything else (text,
 * images, horizontal rules, tables, embedded blocks) counts as content.
 */
const CONTAINER_NODES = new Set([
  'doc',
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'listItem',
])

/**
 * True when a document renders nothing meaningful, so a caller can skip the
 * wrapper markup entirely. An editor that clears a field usually leaves an
 * empty paragraph behind, which `renderRichText` still turns into `<p></p>`.
 *
 * Whitespace-only text is empty; an image, horizontal rule or table is not.
 */
export function isRichTextEmpty(document: RichTextDocument | null | undefined): boolean {
  return isEmptyNode(document)
}

function isEmptyNode(node: unknown): boolean {
  if (!isRecord(node)) return true
  if (node.type === 'text') return typeof node.text !== 'string' || node.text.trim() === ''
  if (typeof node.type !== 'string' || !CONTAINER_NODES.has(node.type)) return false

  return !Array.isArray(node.content) || node.content.every(isEmptyNode)
}

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
