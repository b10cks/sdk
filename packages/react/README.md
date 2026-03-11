# @b10cks/react

React SDK for integrating b10cks into React applications.

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

## Rich Text

Use `B10cksRichText` to render a b10cks TipTap `RichTextDocument` with the default b10cks-compatible TipTap extension set.

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

If you want to override the default TipTap extensions, pass `options.extensions`:

```tsx
import { B10cksRichText } from '@b10cks/react'
import { createB10cksRichTextExtensions } from '@b10cks/richtext'

const extensions = createB10cksRichTextExtensions()

export function CustomBody({ document }: { document: any }) {
  return (
    <B10cksRichText
      document={document}
      options={{ extensions }}
    />
  )
}
```

## License

MIT
