# @b10cks/richtext

Framework-agnostic rich text rendering for [b10cks](https://www.b10cks.com), the open-source headless CMS.

Converts the ProseMirror JSON documents produced by the b10cks editor into HTML or plain text — with zero dependencies, full SSR support, and a tiny bundle (5.5 kB ESM · 1.8 kB gzip · 1.6 kB Brotli).

A separate entry, `@b10cks/richtext/editor`, edits a rendered field in place in the live preview, with the same schema as the b10cks editor. It's built on Tiptap and only ever loaded on demand, so the renderer stays as small as above.

Used internally by the b10cks framework integrations:

- `@b10cks/react` · `@b10cks/vue` · `@b10cks/svelte` · `@b10cks/next` · `@b10cks/nuxt`

## Installation

```bash
npm install @b10cks/richtext
```

No peer dependencies required. The package depends on Tiptap for the preview editor; nothing from it ends up in your bundle unless you import `@b10cks/richtext/editor`.

## Quick start

```ts
import { renderRichText } from '@b10cks/richtext'

const html = renderRichText(document)
```

`document` is the JSON value stored by b10cks for a rich text field. `null` and `undefined` are accepted and render as an empty string.

## HTML rendering

### `renderRichText(document, options?)` · `renderRichTextHtml`

```ts
import { renderRichText } from '@b10cks/richtext'

const html = renderRichText(document, {
  internalLinkHandler: (attrs) => `/blog/${attrs.content}`,
  placeholderHandler: (key) => values[key] ?? null,
})
```

### `createRichTextRenderer(options?)` · `createRichTextHtmlRenderer`

Creates a reusable renderer — useful when options are constant across many documents:

```ts
import { createRichTextRenderer } from '@b10cks/richtext'

const renderer = createRichTextRenderer({
  internalLinkHandler: (attrs) => `/blog/${attrs.content}`,
})

const html = renderer.render(document)
```

## Plain text rendering

Strips all markup. Useful for search indexing, meta descriptions, and Open Graph previews.

### `renderRichTextAsText(document, options?)`

```ts
import { renderRichTextAsText } from '@b10cks/richtext'

const text = renderRichTextAsText(document)

// Custom block separator (default: '\n\n')
const oneLiner = renderRichTextAsText(document, { blockSeparator: ' ' })
```

### `createRichTextTextRenderer(options?)`

```ts
import { createRichTextTextRenderer } from '@b10cks/richtext'

const renderer = createRichTextTextRenderer({ blockSeparator: ' ' })
const text = renderer.render(document)
```

## Emptiness

An editor that clears a field usually leaves an empty paragraph behind, which
`renderRichText` still turns into `<p></p>`. `isRichTextEmpty` tells you whether
a document renders anything, so you can skip the wrapper markup:

```typescript
import { isRichTextEmpty } from '@b10cks/richtext'

isRichTextEmpty(null) // true
isRichTextEmpty({ type: 'doc', content: [{ type: 'paragraph' }] }) // true
isRichTextEmpty({ type: 'doc', content: [{ type: 'horizontalRule' }] }) // false
```

Whitespace-only text counts as empty. An image, horizontal rule or table does
not — those render without carrying any text.

## Internal links

The b10cks editor stores internal links as marks with a `content` ID and an optional `anchor`:

```json
{
  "type": "internalLink",
  "attrs": {
    "content": "01ksarpy7hd99pwbfe26rc04jb",
    "anchor": null
  }
}
```

Delivery responses also carry the target's `url`. Without a handler the link renders with that `url`, or `href="#"` when there is none. Pass `internalLinkHandler` to resolve the ID to a real URL:

```ts
renderRichText(document, {
  internalLinkHandler: (attrs) => {
    // attrs.content — the content record ID
    // attrs.anchor  — optional id of a block on the target page
    const slug = slugMap[attrs.content ?? '']
    return slug ? `/${slug}` : null
  },
})
```

Returning `null` or `undefined` falls back to the `url`, then `href="#"`.

The `anchor` is appended as a fragment (`/about#01kh6h981yh1s5z7s3f80wmrw2`) unless the href already contains `#`. A handler that adds the anchor itself is left alone, and so is the `#` placeholder. The anchor is the target block's `id`, so the page must render it on the block element (`v-editable` and `B10cksComponent` do).

The rendered element carries both `data-type="internal"` (matching the CMS output) and `data-b10cks-internal-link` so client-side router handlers can target either attribute.

## Placeholder tokens

The b10cks editor supports inline placeholder tokens — variables like `{companyName}` that are stored as atomic nodes:

```json
{ "type": "placeholderToken", "attrs": { "key": "companyName", "label": "{companyName}" } }
```

Pass `placeholderHandler` to substitute real values at render time:

```ts
const values = { companyName: 'Google Inc', productName: 'Workspace' }

renderRichText(document, {
  placeholderHandler: (key, label) => values[key] ?? null,
})
// → "Welcome to Google Inc" instead of "Welcome to {companyName}"
```

The handler receives:

- `key` — the variable name (e.g. `"companyName"`)
- `label` — the display hint shown in the editor (e.g. `"{companyName}"`)

Returning `null` or `undefined` leaves the token as a `<span data-type="placeholder-token" data-key="…" data-label="…">` so it can be replaced client-side instead. This works identically in `renderRichTextAsText` — resolved values are injected as plain text, unresolved tokens emit nothing.

## URL safety

Link `href` and image `src` values coming from CMS content are validated against a scheme allowlist before rendering, so stored `javascript:` (and similar) URLs cannot execute. URLs with a disallowed scheme are replaced with `#`; relative URLs, anchors, and query-only URLs always pass.

The default allowlist is exported as `DEFAULT_ALLOWED_SCHEMES` (`http`, `https`, `mailto`, `tel`). Override it per render with `allowedSchemes`:

```ts
import { renderRichText, DEFAULT_ALLOWED_SCHEMES } from '@b10cks/richtext'

// Restrict further — only secure links
renderRichText(document, { allowedSchemes: ['https', 'mailto'] })

// Opt back into javascript: URLs (only for fully trusted content)
renderRichText(document, {
  allowedSchemes: [...DEFAULT_ALLOWED_SCHEMES, 'javascript'],
})
```

`allowedSchemes` is part of `RichTextHtmlOptions`, so the `@b10cks/react`, `@b10cks/vue`, and `@b10cks/svelte` components forward it too.

The same policy is exported for your own code, and `resolveB10cksLink` in `@b10cks/client` and the preview editor's link field use it as well:

```ts
import { isSafeUrl, sanitizeUrl } from '@b10cks/richtext'

isSafeUrl('javascript:alert(1)') // false
sanitizeUrl(attrs.src) // the URL, or '#' when unsafe or not a string
sanitizeUrl(url, { allowedSchemes: ['https'] })
```

Attributes of the wrong type, like a numeric `href` or an object as `src`, render as `#` or are left out, and malformed nodes render nothing, instead of throwing.

## Custom rendering

`nodes` and `marks` replace the HTML of single node or mark types. Each renderer gets the node or mark, its `attrs`, the already rendered `children`, and `renderDefault()` for the built-in output. Return `null` or `undefined` to fall back to the built-in output.

```ts
import { escapeHtml, renderRichText, sanitizeUrl } from '@b10cks/richtext'

renderRichText(document, {
  nodes: {
    // Responsive images
    image: ({ attrs }) => {
      const src = escapeHtml(sanitizeUrl(attrs.src))
      return `<img src="${src}" srcset="${src}?w=640 640w, ${src}?w=1280 1280w" loading="lazy">`
    },
    // Embeds from a custom node type
    youtube: ({ attrs }) =>
      typeof attrs.videoId === 'string'
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(attrs.videoId)}"></iframe>`
        : null,
  },
  marks: {
    // External links open in a new tab
    link: ({ attrs, children }) =>
      typeof attrs.href === 'string' && attrs.href.startsWith('https://')
        ? `<a href="${escapeHtml(attrs.href)}" target="_blank" rel="noopener">${children}</a>`
        : null,
  },
})
```

Renderers are trusted code: the string they return goes into the page as HTML, unescaped. `children` and `renderDefault()` are safe. Escape every other value from the document with `escapeHtml`, and pass URLs through `sanitizeUrl`. Node types the renderer doesn't know render their children, as before, unless a renderer handles them. Renderers registered under inherited object keys like `constructor` are ignored.

## Supported node and mark types

| Node                                               | HTML output                                              |
| -------------------------------------------------- | -------------------------------------------------------- |
| `paragraph`                                        | `<p>`                                                    |
| `heading`                                          | `<h1>` – `<h6>`                                          |
| `blockquote`                                       | `<blockquote>`                                           |
| `codeBlock`                                        | `<pre><code>`                                            |
| `bulletList`                                       | `<ul>` (with `class` from a configured list style)       |
| `orderedList`                                      | `<ol>` (with `class` from a configured list style)       |
| `listItem`                                         | `<li>`                                                   |
| `hardBreak`                                        | `<br>`                                                   |
| `horizontalRule`                                   | `<hr>`                                                   |
| `image`                                            | `<img>`                                                  |
| `table` / `tableRow` / `tableHeader` / `tableCell` | `<table>` / `<tr>` / `<th>` / `<td>`                     |
| `placeholderToken`                                 | resolved value or `<span data-type="placeholder-token">` |

| Mark           | HTML output                                                   |
| -------------- | ------------------------------------------------------------- |
| `bold`         | `<strong>`                                                    |
| `italic`       | `<em>`                                                        |
| `strike`       | `<s>`                                                         |
| `underline`    | `<u>`                                                         |
| `code`         | `<code>`                                                      |
| `link`         | `<a href="…">`                                                |
| `internalLink` | `<a href="…" data-type="internal" data-b10cks-internal-link>` |
| `textClass`    | `<span class="…">`                                            |

### List styles

The b10cks editor lets a space configure named list styles (e.g. a checklist or a
Roman-numeral variant). The chosen style is stored as a `className` attribute on the
`bulletList` / `orderedList` node and rendered as a plain `class`, so it works with any
CSS or framework:

```json
{ "type": "bulletList", "attrs": { "className": "checklist" }, "content": [ … ] }
```

renders as `<ul class="checklist"> … </ul>`. Style the class however your project needs —
the SDK stays framework- and CSS-agnostic. A `class` attribute is also accepted for
hand-authored documents.

## Preview editor

`@b10cks/richtext/editor` turns an element that shows a rendered document into a rich text editor, for in-place editing in the b10cks visual editor. You rarely need it directly: `B10cksRichText` in the framework packages uses it through `attachRichTextField` from `@b10cks/client`, which loads it with a dynamic `import()` in preview mode only. Import it the same way if you build your own integration, never statically:

```ts
const { createRichTextEditor } = await import('@b10cks/richtext/editor')

const editor = createRichTextEditor(el, {
  document,
  config: { features: { table: false }, headingLevels: ['h2', 'h3', 'p'] },
  render: { internalLinkHandler },
  onChange: (next) => save(next),
  onExit: () => editor?.destroy(),
})

editor?.setDocument(changedElsewhere) // merges without moving the caret
editor?.destroy() // leaves the element showing the rendered document
```

- The schema matches the b10cks editor: the same nodes, marks and attributes, and features the field turns off are left out entirely, so paste can't bring them in either. A shared fixture keeps both in step.
- It renders like `renderRichText`, so the page doesn't shift when editing starts.
- `createRichTextEditor` returns `null` for a document with content the field's schema doesn't know, instead of dropping it. Leave such fields to the b10cks editor.
- A small toolbar in a shadow root above the element offers the formats the field allows. Links to other content, placeholders, tables, text classes and list styles are kept, but edited in the b10cks editor.
- Links typed, pasted or autolinked follow `render.allowedSchemes`. A link with another scheme is refused in the toolbar with a visible message.
- `editor.setRender(options)` swaps the render options while editing, so the HTML left by `destroy` uses the latest ones. Custom `nodes` and `marks` renderers don't run inside the editor; the field shows the built-in markup until editing ends.

## Types

```ts
import type {
  RichTextDocument,
  RichTextFieldConfig,
  RichTextHtmlOptions,
  RichTextTextOptions,
  RichTextInternalLinkAttrs,
  RichTextInternalLinkHandler,
  RichTextPlaceholderHandler,
  RichTextRenderer,
  RichTextTextRenderer,
  RichTextNodeRenderer,
  RichTextMarkRenderer,
  UrlPolicy,
} from '@b10cks/richtext'

// Runtime values: the default URL scheme allowlist and the escaping helpers
import { DEFAULT_ALLOWED_SCHEMES, escapeHtml, isSafeUrl, sanitizeUrl } from '@b10cks/richtext'
```

## Framework components

For a framework-specific component that handles the HTML rendering for you, use the matching wrapper package:

- [`@b10cks/react`](../react) · [`@b10cks/vue`](../vue) · [`@b10cks/svelte`](../svelte) · [`@b10cks/next`](../next) · [`@b10cks/nuxt`](../nuxt)

## License

MIT
