import { type AnyExtension, Extension, Mark, mergeAttributes, Node } from '@tiptap/core'
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table'
import { StarterKit, type StarterKitOptions } from '@tiptap/starter-kit'

import type { RichTextFeature, RichTextFieldConfig, RichTextHtmlOptions } from '../index'
import { internalLinkAttributes, isSafeUrl } from '../links'

/**
 * The CMS rich text schema, mirrored from its Tiptap editor: same extensions,
 * node and mark names, attributes, defaults, and parse rules, so a document
 * round-trips through either editor unchanged. Only `renderHTML` differs, to
 * match `renderRichText` so the page keeps its layout while editing. The
 * shared fixture `richtext-documents.json` guards the parity on both sides.
 */

const TOGGLEABLE = [
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
  'horizontalRule',
] as const satisfies readonly (RichTextFeature & keyof StarterKitOptions)[]

/** A feature is on unless the field config explicitly disables it. */
export function isFeatureEnabled(config: RichTextFieldConfig, feature: RichTextFeature): boolean {
  return config.features?.[feature] !== false
}

/**
 * Extensions for a field. Like the CMS, a disabled feature drops its
 * extension, so its node or mark can't come in through paste either.
 */
export function createRichTextExtensions(
  config: RichTextFieldConfig = {},
  render: RichTextHtmlOptions = {}
): AnyExtension[] {
  const enabled = (feature: RichTextFeature) => isFeatureEnabled(config, feature)
  const starterKit: Partial<StarterKitOptions> = {
    heading: enabled('heading') ? { levels: [1, 2, 3, 4, 5, 6] } : false,
    link: enabled('link')
      ? {
          openOnClick: false,
          autolink: true,
          // Same scheme policy as `renderRichText`, for typed, pasted and autolinked URLs.
          isAllowedUri: (url) => isSafeUrl(url, render),
        }
      : false,
  }
  for (const feature of TOGGLEABLE) {
    if (!enabled(feature)) starterKit[feature] = false
  }

  const extensions: AnyExtension[] = [
    StarterKit.configure(starterKit),
    TextClass,
    createPlaceholderToken(render),
  ]
  if (enabled('internalLink')) extensions.push(createInternalLink(render))
  if (enabled('bulletList') || enabled('orderedList')) extensions.push(ListStyle)
  if (enabled('table')) {
    extensions.push(
      Table.configure({ resizable: false, allowTableNodeSelection: true }),
      TableRow,
      TableHeader,
      TableCell
    )
  }
  return extensions
}

const TextClass = Mark.create({
  name: 'textClass',
  priority: 1000,
  keepOnSplit: true,

  addAttributes() {
    return {
      class: {
        default: '',
        parseHTML: (element) => element.getAttribute('class') || '',
        renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[class]',
        getAttrs: (element) => {
          const className = element.getAttribute('class')
          return className ? { class: className } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

const ListStyle = Extension.create({
  name: 'listStyle',

  addGlobalAttributes() {
    return [
      {
        types: ['bulletList', 'orderedList'],
        attributes: {
          className: {
            default: null,
            parseHTML: (element) => element.getAttribute('class') || null,
            renderHTML: (attributes) =>
              attributes.className ? { class: attributes.className } : {},
          },
        },
      },
    ]
  },
})

function createPlaceholderToken(render: RichTextHtmlOptions) {
  return Node.create({
    name: 'placeholderToken',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
      return {
        key: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-key'),
          renderHTML: (attributes) => ({ 'data-key': attributes.key }),
        },
        label: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-label'),
          renderHTML: (attributes) => ({ 'data-label': attributes.label }),
        },
      }
    },

    parseHTML() {
      return [{ tag: 'span[data-type="placeholder-token"]' }]
    },

    // The resolved value, or an empty token span, like `renderRichText`.
    renderHTML({ node, HTMLAttributes }) {
      const resolved = render.placeholderHandler?.(
        String(node.attrs.key ?? ''),
        String(node.attrs.label ?? '')
      )
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          'data-type': 'placeholder-token',
          contenteditable: 'false',
        }),
        resolved ?? '',
      ]
    },
  })
}

function createInternalLink(render: RichTextHtmlOptions) {
  return Mark.create({
    name: 'internalLink',
    priority: 1000,
    keepOnSplit: false,

    addAttributes() {
      return {
        content: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-content'),
        },
        anchor: {
          default: null,
          parseHTML: (element) => element.getAttribute('data-anchor'),
        },
        target: {
          default: null,
          parseHTML: (element) => element.getAttribute('target'),
        },
        rel: {
          default: null,
          parseHTML: (element) => element.getAttribute('rel'),
        },
      }
    },

    parseHTML() {
      return [{ tag: 'a[data-type="internal"]' }]
    },

    // Same element and href as `renderRichText`, so the link looks as on the page.
    renderHTML({ mark }) {
      const attrs = internalLinkAttributes(mark.attrs, render)
      // DOM attributes are strings; `true` marks a boolean attribute.
      return [
        'a',
        Object.fromEntries(Object.entries(attrs).map(([name, v]) => [name, v === true ? '' : v])),
        0,
      ]
    },
  })
}
