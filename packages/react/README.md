# @b10cks/react

React SDK for integrating [b10cks](https://www.b10cks.com), the open-source headless CMS with a composable block-based content API, into React applications.

## Installation

```bash
npm install @b10cks/react @b10cks/client @b10cks/richtext
```

## Usage

```tsx
import { B10cksProvider, useB10cksApi } from '@b10cks/react'

function App() {
  return (
    <B10cksProvider
      apiClientOptions={{
        token: 'your-access-token',
        baseUrl: 'https://api.b10cks.com/api',
      }}
    >
      <Page />
    </B10cksProvider>
  )
}

function Page() {
  const { useContent } = useB10cksApi()
  const content = useContent('home')

  if (content.pending) return <div>Loading...</div>
  return <pre>{JSON.stringify(content.data, null, 2)}</pre>
}
```

## Live preview & visual editing

When your app is rendered inside the b10cks visual editor, these hooks make blocks selectable and keep the preview in sync while editing. They are no-ops outside the editor, so they are safe to leave in production output.

### Provider options

```tsx
<B10cksProvider
  apiClientOptions={{ token, baseUrl }}
  // Offset applied when a selected block is scrolled into view, so selection
  // clears a fixed app header (number → px, or a string like '5rem').
  scrollOffset={80}
  // Restrict the preview bridge handshake to known editor origins.
  allowedOrigins={['https://app.b10cks.com']}
>
  …
</B10cksProvider>
```

`scrollOffset` can also be set purely in CSS — `:root { --b10cks-scroll-offset: 80px }`.

### Hooks

```tsx
import { useEditable, useEditableField, usePreviewContent, usePreviewSelection } from '@b10cks/react'

function Hero({ block }: { block: HeroBlock }) {
  // Make the element selectable; click selects it and the editor highlights/scrolls to it.
  const ref = useEditable<HTMLElement>(block.id)

  // Inline-edit a simple string field (contenteditable, streams edits back):
  const headlineRef = useEditableField<HTMLHeadingElement>({ id: block.id, field: 'headline' })

  // Rich text / complex fields: deep-select so the editor opens its own editor.
  const bodyRef = useEditableField<HTMLDivElement>({ id: block.id, path: ['body'], mode: 'select' })

  return (
    <section ref={ref}>
      <h1 ref={headlineRef}>{block.headline}</h1>
      <div ref={bodyRef}>
        <B10cksRichText document={block.body} />
      </div>
    </section>
  )
}
```

For whole-tree reactive updates — including nested and rich text fields — wrap your fetched content in `usePreviewContent`. It returns the content live-updated from the editor, and `initial` unchanged outside preview mode. When `initial` changes identity (a route change, revalidation, or locale switch under a persistent layout), the preview resets to the new tree instead of keeping the first one:

```tsx
function Page({ initialContent }: { initialContent: PageContent }) {
  const content = usePreviewContent(initialContent)
  return <B10cksComponent block={content} />
}
```

`usePreviewSelection(blockId)` returns `{ isSelected, isHovered }` if you prefer to drive your own highlight styling.

## Rich Text

Use `B10cksRichText` to render a b10cks `RichTextDocument` (a TipTap/ProseMirror-style JSON document) with a dependency-free, SSR-friendly renderer.

```tsx
import { B10cksRichText } from '@b10cks/react'

type PageBlock = {
  body?: {
    type: 'doc'
    content?: unknown[]
  } | null
}

export function PageBody({ block }: { block: PageBlock }) {
  return (
    <B10cksRichText
      document={block.body}
      className="prose"
    />
  )
}
```

If you need the rendered HTML string on the server or inside your own component logic, use `renderRichTextHtml`:

```tsx
import { renderRichTextHtml } from '@b10cks/react'

const html = renderRichTextHtml(block.body)
```

To extract plain text (useful for search indexing, meta descriptions, or `og:description`), use `renderRichTextAsText`:

```tsx
import { renderRichTextAsText } from '@b10cks/react'

const text = renderRichTextAsText(block.body)
// or with a custom block separator:
const inline = renderRichTextAsText(block.body, { blockSeparator: ' ' })
```

`options` accepts an `internalLinkHandler` (to customise how internal-link hrefs are generated), a `placeholderHandler` (to resolve `{token}` placeholders to real values), and `allowedSchemes` (the URL scheme allowlist for link/image URLs):

```tsx
import { B10cksRichText } from '@b10cks/react'

export function CustomBody({ document }: { document: any }) {
  return (
    <B10cksRichText
      document={document}
      options={{
        internalLinkHandler: (attrs) => `/app${attrs.url ?? ''}`,
        placeholderHandler: (key) => ({ companyName: 'b10cks' })[key],
      }}
    />
  )
}
```

> Link and image URLs from CMS content are validated against a scheme allowlist (default `http`/`https`/`mailto`/`tel`), so stored `javascript:` URLs cannot execute. Override it via `options.allowedSchemes` — see the [`@b10cks/richtext` URL safety docs](../richtext/README.md#url-safety).

> The renderer is a custom, dependency-free implementation — it does not run TipTap, and there is no `extensions` option.

## License

MIT
