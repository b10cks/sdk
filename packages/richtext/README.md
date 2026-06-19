# @b10cks/richtext

Framework-agnostic rich text rendering for [b10cks](https://www.b10cks.com), the open-source headless CMS.

Converts the ProseMirror JSON documents produced by the b10cks editor into HTML or plain text — with zero dependencies, full SSR support, and a tiny bundle (5.5 kB ESM · 1.8 kB gzip · 1.6 kB Brotli).

Used internally by the b10cks framework integrations:

- `@b10cks/react` · `@b10cks/vue` · `@b10cks/svelte` · `@b10cks/next` · `@b10cks/nuxt`

## Installation

```bash
npm install @b10cks/richtext
```

No peer dependencies required.

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
  placeholderHandler:  (key)   => values[key] ?? null,
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

Without a handler the link renders with `href="#"`. Pass `internalLinkHandler` to resolve the ID to a real URL:

```ts
renderRichText(document, {
  internalLinkHandler: (attrs) => {
    // attrs.content — the content record ID
    // attrs.anchor  — optional anchor fragment
    const slug = slugMap[attrs.content ?? '']
    return slug ? `/${slug}${attrs.anchor ? `#${attrs.anchor}` : ''}` : null
  },
})
```

Returning `null` or `undefined` falls back to `href="#"`.

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

## Supported node and mark types

| Node | HTML output |
|---|---|
| `paragraph` | `<p>` |
| `heading` | `<h1>` – `<h6>` |
| `blockquote` | `<blockquote>` |
| `codeBlock` | `<pre><code>` |
| `bulletList` | `<ul>` |
| `orderedList` | `<ol>` |
| `listItem` | `<li>` |
| `hardBreak` | `<br>` |
| `horizontalRule` | `<hr>` |
| `image` | `<img>` |
| `table` / `tableRow` / `tableHeader` / `tableCell` | `<table>` / `<tr>` / `<th>` / `<td>` |
| `placeholderToken` | resolved value or `<span data-type="placeholder-token">` |

| Mark | HTML output |
|---|---|
| `bold` | `<strong>` |
| `italic` | `<em>` |
| `strike` | `<s>` |
| `underline` | `<u>` |
| `code` | `<code>` |
| `link` | `<a href="…">` |
| `internalLink` | `<a href="…" data-type="internal" data-b10cks-internal-link>` |
| `textClass` | `<span class="…">` |

## Types

```ts
import type {
  RichTextDocument,
  RichTextHtmlOptions,
  RichTextTextOptions,
  RichTextInternalLinkAttrs,
  RichTextInternalLinkHandler,
  RichTextPlaceholderHandler,
  RichTextRenderer,
  RichTextTextRenderer,
} from '@b10cks/richtext'
```

## Framework components

For a framework-specific component that handles the HTML rendering for you, use the matching wrapper package:

- [`@b10cks/react`](../react) · [`@b10cks/vue`](../vue) · [`@b10cks/svelte`](../svelte) · [`@b10cks/next`](../next) · [`@b10cks/nuxt`](../nuxt)

## License

MIT
