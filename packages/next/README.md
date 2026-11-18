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

## Redirects

Answer b10cks redirects in `proxy.ts` (`middleware.ts` before Next.js 16), before anything renders:

```ts
// proxy.ts
import { createB10cksRedirects } from '@b10cks/next/middleware'

export default createB10cksRedirects({
  token: process.env.B10CKS_TOKEN || '',
  baseUrl: 'https://api.b10cks.com/api',
  // Keep the list longer than the default 60 seconds:
  // maxAge: 300,
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
}
```

The handler fetches the full redirect list, all pages, and keeps it per server instance for `maxAge` seconds. The list never reaches the browser. Create the handler once, at module scope. Requests with `b10cks_vid`, the visual editor's preview, are not redirected.

An expired list keeps answering while one refresh runs in the background, so visitors do not wait for it. Only the first requests of a new instance wait, for at most 3 seconds. A failed refresh keeps the list it had and tries again after `maxAge`.

A trailing slash and URL encoding do not affect the match, upper and lower case do. The query of the request is added to the target. If both set the same key, the target's value stays. `basePath` is applied to the target. Client-side navigation runs through the proxy too, so links to old paths are redirected as well.

The handler resolves to `undefined` for every other request, so it combines with your own proxy. Use `createB10cksRedirectResolver` for your own rules:

```ts
// proxy.ts
import { createB10cksRedirectResolver } from '@b10cks/next/middleware'
import { type NextFetchEvent, type NextRequest, NextResponse } from 'next/server'

const resolveRedirect = createB10cksRedirectResolver({
  token: process.env.B10CKS_TOKEN || '',
  baseUrl: 'https://api.b10cks.com/api',
})

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const hit = await resolveRedirect(request.nextUrl.pathname, event)
  if (hit) return NextResponse.redirect(new URL(hit.target, request.url), hit.status_code || 301)
  return NextResponse.next()
}
```

Do not load redirects with `useRedirects` to resolve them on each page. That sends the whole list to the browser.

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

`@b10cks/next/client` re-exports everything from `@b10cks/react`, including the [data hooks](../react/README.md#fetching-data).

### Redirected and missing pages

In a Client Component that renders the entry of the current route, pass `forRoute: true`:

```tsx
'use client'

import { useB10cksApi } from '@b10cks/next/client'

export function Page({ slug }: { slug: string }) {
  const { data: page } = useB10cksApi().useContent(slug, {}, { forRoute: true })
  // …
}
```

A redirected slug then navigates to its target, and a missing slug renders the nearest `not-found` page. Leave `forRoute` off for entries that are not the page, such as an entry a block loads by slug. Both cases then only set `error`.

### Content version

The visual editor appends `?b10cks_vid` to preview a draft. `useB10cksVersion()` returns that version, defaulting to `published`. It reads `useSearchParams`, so on a static route keep the component inside a `<Suspense>`:

```tsx
const vid = useB10cksVersion()
const { data: page } = useB10cksApi().useContent('home', { vid })
```

### Page translations

`usePageTranslations` shares a `locale → path` map below `B10cksNextProvider`, for a language switcher outside the page:

```tsx
'use client'

import { usePageTranslations } from '@b10cks/next/client'
import { useEffect } from 'react'

export function PageTranslations({ content }: { content: IBContent }) {
  const { setFromContent, clear } = usePageTranslations()

  useEffect(() => {
    setFromContent(content)
    return clear
  }, [content, setFromContent, clear])

  return null
}

export function LanguageSwitcher() {
  const { translations } = usePageTranslations()
  // translations: { en: '/en/about', de: '/de/ueber-uns' }
}
```

The map fills after hydration. To render the links on the server, call `getPageTranslations(content)` from `@b10cks/next/server` in a Server Component.

## Live preview & visual editing

`B10cksNextProvider` forwards the preview options to `@b10cks/react`, and `@b10cks/next/client` re-exports the editing hooks (`useEditable`, `useEditableField`, `usePreviewContent`, `usePreviewSelection`). They are no-ops outside the b10cks visual editor.

```tsx
'use client'

import { B10cksNextProvider } from '@b10cks/next/client'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <B10cksNextProvider
      apiClientOptions={{
        token: process.env.NEXT_PUBLIC_B10CKS_TOKEN || '',
        baseUrl: 'https://api.b10cks.com/api',
      }}
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

See the [`@b10cks/react` README](../react/README.md#live-preview--visual-editing) for the full hook reference. `blockAnchorAttrs` and `resolveB10cksLink` are exported from `@b10cks/next` and `@b10cks/next/client`; see [link anchors](../react/README.md#link-anchors). `scrollOffset` can also be set purely in CSS — `:root { --b10cks-scroll-offset: 80px }`.

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

`defineB10cksNextApi` wraps creation in React's `cache()`, so every server request render gets its own client (with its own revision and caches) while a single request reuses one instance. This makes it safe to export at module scope. The `optionsFactory` runs once per request and is synchronous, so it cannot await `headers()` or `draftMode()` on Next.js 15 and newer. For a preview request, call `createB10cksNextApi` in the page with the `requestUrl` you built there.

```ts
// lib/b10cks.ts
import { defineB10cksNextApi } from '@b10cks/next/server'

export const getB10cks = defineB10cksNextApi(() => ({
  token: process.env.B10CKS_TOKEN || '',
  baseUrl: 'https://api.b10cks.com/api',
  fetchClient: fetch,
}))

// app/page.tsx
import { getB10cks } from '@/lib/b10cks'

export default async function Page() {
  const { dataApi } = getB10cks()
  const home = await dataApi.getContent('home')
  // …
}
```

### Redirected and missing pages

`getRouteContent` loads the entry of the current route at the latest published revision, and always resolves with an entry:

```tsx
// app/[...slug]/page.tsx
import { getB10cks } from '@/lib/b10cks'

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const page = await getB10cks().getRouteContent(slug.join('/'))
  // …
}
```

A slug that has a redirect redirects, and a missing slug renders the nearest `not-found` page. During rendering Next.js only sends 307 and 308, so a 301 or 308 redirect answers with 308 and all others with 307. The `proxy.ts` handler above sends the exact status code. Call `getRouteContent` outside `try`, because Next.js signals both cases with an error. A `loading.tsx` or `<Suspense>` above the page starts the response early, and Next.js then answers with status 200 and a meta tag instead of the redirect or 404 status.

`dataApi.getContent` rejects with a `ContentRedirectError` or an `ApiError` of status 404 instead. Use it, or `dataApi.resolveContent`, for entries that are not the page.

### Keep listings out of the client payload

Props of a Client Component are serialised into the page. A block that lists other entries should map them down to the fields its cards show in the Server Component, and pass only those:

```tsx
const entries = await dataApi.getContents<Article>({
  filter: { content_type: 'article' },
  per_page: 6,
})
const cards = entries.map((entry) => ({ id: entry.id, title: entry.content.title }))

return <ArticleCards cards={cards} />
```

In Client Components, `transform` does the same for the [data hooks](../react/README.md#map-listings-down-with-transform).

### Config

Each set of params is its own request. Calling `getConfig` once with `language_iso` and once without loads the config twice, so wrap it in one function of your site that always passes the language.

## Opening images

`B10cksImg` renders a b10cks asset with `next/image`, in Server and Client Components:

```tsx
import { B10cksImg } from '@b10cks/next/image'

export function Hero({ image }: { image: B10cksAssetValue }) {
  return (
    <B10cksImg
      asset={image}
      sizes="(min-width: 768px) 50vw, 100vw"
      loading="eager"
      className="rounded"
    />
  )
}
```

Width, height and alt text come from the asset, and the props of the same name override them. With `fill`, width and height are left out. Other props work as on `next/image`. Allow your asset host in `images.remotePatterns`, or pass a `loader`.

Images are lazy by default. Set `loading="eager"` on the image the page opens with, usually its largest paint. It is then fetched at high priority, with a preload link that matches the image's `srcset` and `sizes`.

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

In a client component, pass `editable={{ id: block.id, path: ['body'] }}` to let editors edit the text in place in the visual editor. See [`@b10cks/react`](../react/README.md#editing-rich-text-in-the-preview).

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
