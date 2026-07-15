# @b10cks/next

Next.js integration for [b10cks](https://www.b10cks.com), the open-source headless CMS, built on top of `@b10cks/react`.

## Installation

```bash
npm install @b10cks/next @b10cks/react @b10cks/client @b10cks/richtext
```

Or let the CLI install the packages, wrap `next.config.ts`, add a provider, and
write `.env` for you:

```bash
npx @b10cks/cli init
```

```bash
# .env
NEXT_PUBLIC_B10CKS_TOKEN=your-access-token  # client components
B10CKS_TOKEN=your-access-token              # server components
```

## Configure Next.js

```ts
// next.config.ts
import { withB10cks } from '@b10cks/next'

export default withB10cks({
  reactStrictMode: true,
})
```

## Client Usage

```tsx
'use client'

import { B10cksNextProvider, useB10cksApi } from '@b10cks/next/client'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <B10cksNextProvider
      apiClientOptions={{
        token: process.env.NEXT_PUBLIC_B10CKS_TOKEN || '',
        baseUrl: 'https://api.b10cks.com/api',
      }}
    >
      {children}
    </B10cksNextProvider>
  )
}
```

## Live preview & visual editing

`B10cksNextProvider` forwards the preview options to `@b10cks/react`, and `@b10cks/next/client` re-exports the editing hooks (`useEditable`, `useEditableField`, `usePreviewContent`, `usePreviewSelection`). They are no-ops outside the b10cks visual editor.

```tsx
'use client'

import { B10cksNextProvider } from '@b10cks/next/client'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <B10cksNextProvider
      apiClientOptions={{ token: process.env.NEXT_PUBLIC_B10CKS_TOKEN || '', baseUrl: 'https://api.b10cks.com/api' }}
      // Offset so selection clears a fixed app header (number → px, or '5rem').
      scrollOffset={80}
      // Restrict the preview bridge handshake to known editor origins.
      allowedOrigins={['https://app.b10cks.com']}
    >
      {children}
    </B10cksNextProvider>
  )
}
```

```tsx
'use client'

import { useEditable, useEditableField, usePreviewContent } from '@b10cks/next/client'
```

See the [`@b10cks/react` README](../react/README.md#live-preview--visual-editing) for the full hook reference. `scrollOffset` can also be set purely in CSS — `:root { --b10cks-scroll-offset: 80px }`.

## Server Usage

```ts
import { createB10cksNextApi } from '@b10cks/next/server'

const { dataApi } = createB10cksNextApi({
  token: process.env.B10CKS_TOKEN || '',
  baseUrl: 'https://api.b10cks.com/api',
  fetchClient: fetch,
})
```

> **Request-scoped state.** The returned client holds request-scoped state — the content revision (`rv`, which a preview/draft request pins) and per-instance caches. **Do not** hoist the result into a module-level singleton: a preview request would pin a draft revision that then bleeds to every subsequent visitor. Create it per request, or use `defineB10cksNextApi` below.

### Request-scoped singleton (App Router)

`defineB10cksNextApi` wraps creation in React's `cache()`, so every server request render gets its own client (with its own revision and caches) while a single request reuses one instance. This makes it safe to export at module scope. The `optionsFactory` runs once per request — read per-request values (e.g. `headers()`, `draftMode()`) inside it.

```ts
// lib/b10cks.ts
import { headers } from 'next/headers'
import { defineB10cksNextApi } from '@b10cks/next/server'

export const getB10cks = defineB10cksNextApi(() => ({
  token: process.env.B10CKS_TOKEN || '',
  baseUrl: 'https://api.b10cks.com/api',
  fetchClient: fetch,
  requestUrl: new URL(headers().get('x-url') ?? 'http://localhost'),
}))

// app/page.tsx
import { getB10cks } from '@/lib/b10cks'

export default async function Page() {
  const { dataApi } = getB10cks()
  const home = await dataApi.getContent('home')
  // …
}
```

## Rich Text

Use `B10cksRichText` to render a b10cks `RichTextDocument` (a TipTap/ProseMirror-style JSON document) on the server or client with a dependency-free renderer.

```tsx
import { B10cksRichText } from '@b10cks/next'

type PageProps = {
  page: {
    content: {
      body?: {
        type: 'doc'
        content?: unknown[]
      } | null
    }
  }
}

export function PageBody({ page }: PageProps) {
  return (
    <B10cksRichText
      document={page.content.body}
      className="prose"
    />
  )
}
```

If you want to render the HTML string yourself first, use `renderRichTextHtml`:

```tsx
import { B10cksRichText, renderRichTextHtml } from '@b10cks/next'

type RichTextDocument = {
  type: 'doc'
  content?: unknown[]
}

export function PageBody({ document }: { document: RichTextDocument | null | undefined }) {
  const html = renderRichTextHtml(document)

  return (
    <B10cksRichText
      document={document}
      html={html}
      className="prose"
    />
  )
}
```

To extract plain text (useful for `og:description`, search indexing, or previews), use `renderRichTextAsText`:

```tsx
import { renderRichTextAsText } from '@b10cks/next'
import type { RichTextDocument } from '@b10cks/next'

export function getMetaDescription(document: RichTextDocument | null | undefined): string {
  return renderRichTextAsText(document, { blockSeparator: ' ' })
}
```

The default renderer is compatible with the following b10cks TipTap setup:

- `StarterKit` with heading levels `1-6`
- `Underline`
- `Link`
- `InternalLink`
- `TextClass`
- `Table`
- `TableRow`
- `TableHeader`
- `TableCell`

## License

MIT
