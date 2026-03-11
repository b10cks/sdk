# @b10cks/richtext

Framework-agnostic rich text rendering for b10cks RichText documents using [`@tiptap/html`](https://tiptap.dev/).

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

`@b10cks/richtext` converts a TipTap-based `RichTextDocument` from b10cks into an HTML string on the server or client without needing a browser-only editor instance.

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

### `createB10cksRichTextExtensions()`

Returns the default TipTap extensions used by b10cks-richtext rendering.

```ts
import { createB10cksRichTextExtensions } from '@b10cks/richtext'

const extensions = createB10cksRichTextExtensions()
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
- `RichTextLinkAttrs`
- `RichTextRenderer`

## Framework wrappers

If you want a framework-specific component instead of plain HTML rendering, use one of the wrapper packages:

- `@b10cks/react`
- `@b10cks/vue`
- `@b10cks/svelte`
- `@b10cks/next`
- `@b10cks/nuxt`

## License

MIT
