import type { Extensions, JSONContent } from '@tiptap/core'

import { Mark, mergeAttributes } from '@tiptap/core'
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

export interface RichTextLinkAttrs {
  href?: string | null
  target?: string | null
  rel?: string | null
  anchor?: string | null
  cached_url?: string | null
  linktype?: string | null
  uuid?: string | null
  id?: string | null
  [key: string]: unknown
}

export interface RichTextHtmlOptions extends RichTextExtensionOptions {}

export interface RichTextRenderer {
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
  HTMLAttributes: RichTextLinkAttrs
}>({
  name: 'internalLink',

  inclusive: false,

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: null,
      },
      rel: {
        default: null,
      },
      anchor: {
        default: null,
      },
      cached_url: {
        default: null,
      },
      linktype: {
        default: null,
      },
      uuid: {
        default: null,
      },
      id: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-b10cks-internal-link]',
      },
      {
        tag: 'a[data-type="internal-link"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }: RichTextMarkRenderContext<RichTextLinkAttrs>) {
    const href =
      typeof HTMLAttributes.href === 'string' && HTMLAttributes.href.length > 0
        ? HTMLAttributes.href
        : '#'

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

export function createB10cksRichTextExtensions(): Extensions {
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
    InternalLink,
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
  const extensions = options.extensions ?? createB10cksRichTextExtensions()
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
