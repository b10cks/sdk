import type { Extensions, JSONContent } from '@tiptap/core'

import { generateText, Mark, mergeAttributes } from '@tiptap/core'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Underline from '@tiptap/extension-underline'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'

export interface RichTextDocument extends JSONContent {}

export interface RichTextExtensionOptions {
  /**
   * Custom TipTap extensions. When omitted, the default b10cks-compatible
   * extensions are used.
   */
  extensions?: Extensions
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

export interface RichTextHtmlOptions extends RichTextExtensionOptions {
  /**
   * Handler for resolving internal link hrefs. Receives the link's attrs and
   * should return the href string to use, or null/undefined to fall back to
   * the default (the `url` or `href` attribute value).
   */
  internalLinkHandler?: RichTextInternalLinkHandler
}

export interface RichTextTextOptions extends RichTextExtensionOptions {
  blockSeparator?: string
}

export interface RichTextRenderer {
  render: (document: RichTextDocument | null | undefined) => string
}

export interface RichTextTextRenderer {
  render: (document: RichTextDocument | null | undefined) => string
}

const EMPTY_DOCUMENT: RichTextDocument = {
  type: 'doc',
  content: [],
}

type RichTextMarkRenderContext<TAttributes extends Record<string, unknown>> = {
  HTMLAttributes: TAttributes
}

const InternalLink = Mark.create<{
  HTMLAttributes: RichTextInternalLinkAttrs
  internalLinkHandler?: RichTextInternalLinkHandler
}>({
  name: 'internalLink',

  inclusive: false,

  addAttributes() {
    return {
      url: { default: null },
      href: { default: null },
      title: { default: null },
      target: { default: null },
      rel: { default: null },
      anchor: { default: null },
      content: { default: null },
      cached_url: { default: null },
      linktype: { default: null },
      uuid: { default: null },
      id: { default: null },
    }
  },

  parseHTML() {
    return [
      { tag: 'a[data-b10cks-internal-link]' },
      { tag: 'a[data-type="internal-link"]' },
    ]
  },

  renderHTML({ HTMLAttributes }: RichTextMarkRenderContext<RichTextInternalLinkAttrs>) {
    const attrs = HTMLAttributes as RichTextInternalLinkAttrs
    const defaultHref =
      (typeof attrs.url === 'string' && attrs.url.length > 0)
        ? attrs.url
        : (typeof attrs.href === 'string' && attrs.href.length > 0)
          ? attrs.href
          : '#'

    const handler = this.options.internalLinkHandler
    const href = handler ? (handler(attrs) ?? defaultHref) : defaultHref

    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        href,
        'data-b10cks-internal-link': '',
        'data-type': 'internal-link',
      }),
      0,
    ]
  },
})

const TextClass = Mark.create({
  name: 'textClass',

  addAttributes() {
    return {
      class: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[class]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }: RichTextMarkRenderContext<Record<string, unknown>>) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

export function createB10cksRichTextExtensions(
  options: Pick<RichTextHtmlOptions, 'internalLinkHandler'> = {}
): Extensions {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    options.internalLinkHandler
      ? InternalLink.configure({ internalLinkHandler: options.internalLinkHandler })
      : InternalLink,
    TextClass,
    Table.configure({
      resizable: true,
      handleWidth: 4,
      cellMinWidth: 50,
      lastColumnResizable: true,
      allowTableNodeSelection: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ]
}

export function renderRichText(
  document: RichTextDocument | null | undefined,
  options: RichTextHtmlOptions = {}
): string {
  const extensions =
    options.extensions ?? createB10cksRichTextExtensions({ internalLinkHandler: options.internalLinkHandler })
  return generateHTML(document ?? EMPTY_DOCUMENT, extensions)
}

export const renderRichTextHtml = renderRichText

export function createRichTextRenderer(options: RichTextHtmlOptions = {}): RichTextRenderer {
  return {
    render(document) {
      return renderRichText(document, options)
    },
  }
}

export const createRichTextHtmlRenderer = createRichTextRenderer

export function renderRichTextAsText(
  document: RichTextDocument | null | undefined,
  options: RichTextTextOptions = {}
): string {
  const extensions = options.extensions ?? createB10cksRichTextExtensions()
  return generateText(document ?? EMPTY_DOCUMENT, extensions, {
    blockSeparator: options.blockSeparator,
  })
}

export function createRichTextTextRenderer(options: RichTextTextOptions = {}): RichTextTextRenderer {
  return {
    render(document) {
      return renderRichTextAsText(document, options)
    },
  }
}
