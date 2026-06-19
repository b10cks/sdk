# @b10cks/richtext

Framework-agnostic rich text rendering for [b10cks](https://www.b10cks.com), the open-source headless CMS, using [`@tiptap/html`](https://tiptap.dev/).

This package provides the shared, SSR-friendly HTML rendering layer used by the b10cks framework integrations for:

- `@b10cks/react`
- `@b10cks/vue`
- `@b10cks/svelte`
- `@b10cks/next`
- `@b10cks/nuxt`

## Installation

```bash
npm install @b10cks/richtext
```

You will also need the TipTap packages used by the default renderer:

```bash
npm install @tiptap/core @tiptap/html @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-underline @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell
```

## What it does

`@b10cks/richtext` converts a TipTap-based `RichTextDocument` from b10cks into an HTML string or plain text on the server or client without needing a browser-only editor instance.

It ships with a default extension set compatible with this b10cks editor configuration:

- `StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } })`
- `Underline`
- `Link.configure({ openOnClick: false, autolink: true })`
- `InternalLink`
- `TextClass`
- `Table.configure({ resizable: true, handleWidth: 4, cellMinWidth: 50, lastColumnResizable: true, allowTableNodeSelection: true })`
- `TableRow`
- `TableHeader`
- `TableCell`

## Basic usage

```ts
import { renderRichText } from '@b10cks/richtext'

const html = renderRichText(document)
```

## API

### `renderRichText(document, options?)`

Renders a b10cks rich text document to HTML.

```ts
import { renderRichText } from '@b10cks/richtext'

const html = renderRichText(document)
```

If `document` is `null` or `undefined`, an empty TipTap document is rendered.

### `renderRichTextHtml(document, options?)`

Alias for `renderRichText`.

```ts
import { renderRichTextHtml } from '@b10cks/richtext'

const html = renderRichTextHtml(document)
```

### `createRichTextRenderer(options?)`

Creates a reusable renderer object.

```ts
import { createRichTextRenderer } from '@b10cks/richtext'

const renderer = createRichTextRenderer()

const html = renderer.render(document)
```

### `createRichTextHtmlRenderer(options?)`

Alias for `createRichTextRenderer`.

### `renderRichTextAsText(document, options?)`

Renders a b10cks rich text document to a plain text string. Useful for search indexing, meta descriptions, or any context where HTML is not appropriate.

```ts
import { renderRichTextAsText } from '@b10cks/richtext'

const text = renderRichTextAsText(document)
```

An optional `blockSeparator` controls the string inserted between block-level nodes (defaults to a newline):

```ts
const text = renderRichTextAsText(document, { blockSeparator: ' ' })
```

### `createRichTextTextRenderer(options?)`

Creates a reusable plain text renderer object.

```ts
import { createRichTextTextRenderer } from '@b10cks/richtext'

const renderer = createRichTextTextRenderer()

const text = renderer.render(document)
```

### `createB10cksRichTextExtensions(options?)`

Returns the default TipTap extensions used by b10cks-richtext rendering. Accepts the same `internalLinkHandler` option as `renderRichText`.

```ts
import { createB10cksRichTextExtensions } from '@b10cks/richtext'

const extensions = createB10cksRichTextExtensions()
```

## Internal link handler

b10cks internal links have this JSON shape in a rich text document:

```json
{
  "type": "internalLink",
  "attrs": {
    "url": "/datenschutz",
    "title": "Datenschutz",
    "anchor": null,
    "content": "01ksarpy7hd99pwbfe26rc04jb"
  }
}
```

By default the `url` attribute is used as the `href`. Pass an `internalLinkHandler` to customise link generation — for example to prepend a locale prefix or map content IDs to your router:

```ts
import { renderRichText } from '@b10cks/richtext'

const html = renderRichText(document, {
  internalLinkHandler: (attrs) => `/app${attrs.url}`,
})
```

Return `null` or `undefined` from the handler to fall back to the default `url`/`href` value.

You can also wire the handler into a reusable extension set:

```ts
import { createB10cksRichTextExtensions } from '@b10cks/richtext'

const extensions = createB10cksRichTextExtensions({
  internalLinkHandler: (attrs) => `/app${attrs.url}`,
})
```

## Custom extensions

If you want to override the default extension list, pass your own `extensions` array.

```ts
import { renderRichText } from '@b10cks/richtext'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'

const html = renderRichText(document, {
  extensions: [
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
  ],
})
```

## Example with server-side rendering

```ts
import { renderRichText } from '@b10cks/richtext'

export function renderArticle(body: unknown) {
  return renderRichText(body as never)
}
```

## Types

The package exports these main types:

- `RichTextDocument`
- `RichTextExtensionOptions`
- `RichTextHtmlOptions`
- `RichTextTextOptions`
- `RichTextInternalLinkAttrs`
- `RichTextInternalLinkHandler`
- `RichTextRenderer`
- `RichTextTextRenderer`

## Framework wrappers

If you want a framework-specific component instead of plain HTML rendering, use one of the wrapper packages:

- `@b10cks/react`
- `@b10cks/vue`
- `@b10cks/svelte`
- `@b10cks/next`
- `@b10cks/nuxt`

## License

MIT
