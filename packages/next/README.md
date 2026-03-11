# @b10cks/next

Next.js integration for b10cks built on top of `@b10cks/react`.

## Installation

```bash
npm install @b10cks/next @b10cks/react @b10cks/client @b10cks/richtext
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

## Server Usage

```ts
import { createB10cksNextApi } from '@b10cks/next/server'

const { dataApi } = createB10cksNextApi({
  token: process.env.B10CKS_TOKEN || '',
  baseUrl: 'https://api.b10cks.com/api',
  fetchClient: fetch,
})
```

## Rich Text

Use `B10cksRichText` to render a TipTap-based b10cks rich text document on the server or client.

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
