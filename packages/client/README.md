# @b10cks/client

Core API client for [b10cks](https://www.b10cks.com), the open-source headless CMS with a composable block-based content API.

## Installation

```bash
npm install @b10cks/client
```

## Usage

```typescript
import { ApiClient, createB10cksDataApi } from '@b10cks/client'

const client = new ApiClient({
  baseUrl: 'https://api.b10cks.com/api',
  token: 'your-access-token',
  version: 'published', // 'published' (default) or 'draft'
  rv: 0,               // revision token — pass Date.now() to bypass CDN cache
})

// Factory function — equivalent to new B10cksDataApi(client)
const dataApi = createB10cksDataApi(client)
// or: import { B10cksDataApi } from '@b10cks/client'; const dataApi = new B10cksDataApi(client)

// Fetch a page of contents
const contents = await dataApi.getContents({ vid: 'published', page: 1, per_page: 20 })

// Fetch all contents across all pages
const allContents = await dataApi.getContents({ vid: 'published' }, { allPages: true })

// Fetch a single content entry by slug
const content = await dataApi.getContent('home', { vid: 'draft' })

// Fetch a single block by ID
const block = await dataApi.getBlock('block-id')

// Full-text search
const results = await dataApi.search({ q: 'hello world', language: 'en' })

// Redirect lookup (POST)
const redirect = await dataApi.lookupRedirect('/old-path')
if (redirect) {
  console.log(redirect.target, redirect.status_code)
}
```

## Typed Filters

`getContents`, `getBlocks`, and `getRedirects` accept a `filter` object whose fields map directly to the Laravel AdvancedFilter query-param scheme. Filter values can be plain values, operator objects, or date ranges — they are serialized to the wire format (`op:value`) automatically.

```typescript
import { serializeFilter } from '@b10cks/client'

// Typed filter on getContents
const contents = await dataApi.getContents({
  filter: {
    language: 'en',
    content_type: 'article',
    published_at: { gte: '2024-01-01T00:00:00Z' },
    parent_id: { in: ['id-1', 'id-2'] },
    include_fallback: true,
  },
  sort: ['-published_at', 'content.title'],
})

// Typed filter on getBlocks
const blocks = await dataApi.getBlocks({
  filter: {
    is_nestable: true,
    tags: ['hero', 'banner'],
    updated_at: { between: ['2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z'] },
  },
})

// Typed filter on getRedirects
const redirectMap = await dataApi.getRedirects({
  filter: { source: { '^like': '/blog' } },
})
```

### Filter operators

| Operator object | Wire format | Meaning |
|---|---|---|
| `'value'` | `value` | Exact match |
| `{ eq: 'v' }` | `eq:v` | Exact match |
| `{ neq: 'v' }` | `neq:v` | Not equal |
| `{ in: ['a','b'] }` | `in:a,b` | One of |
| `{ '!in': ['a','b'] }` | `!in:a,b` | None of |
| `{ like: 'v' }` | `like:v` | Contains |
| `{ '!like': 'v' }` | `!like:v` | Does not contain |
| `{ '^like': 'v' }` | `^like:v` | Starts with |
| `{ 'like$': 'v' }` | `like$:v` | Ends with |
| `{ gte: 'v' }` | `gte:v` | Greater than or equal |
| `{ gt: 'v' }` | `gt:v` | Greater than |
| `{ lte: 'v' }` | `lte:v` | Less than or equal |
| `{ lt: 'v' }` | `lt:v` | Less than |
| `{ between: ['a','b'] }` | `a...b` | Range (dates) |
| `{ null: true }` | `null:` | Is null |
| `{ '!null': true }` | `!null:` | Is not null |

### Content sort

`sort` accepts a string or a typed array of `ContentSortItem` values. Prefix with `-` for descending order. JSON content fields are supported via `content.{field}`.

```typescript
sort: '-published_at'          // single field, descending
sort: ['updated_at', '-created_at']
sort: ['content.title', '-published_at']
```

### `serializeFilter` utility

If you need the flat query params for your own requests, `serializeFilter` is exported:

```typescript
import { serializeFilter } from '@b10cks/client'

const params = serializeFilter({
  language: 'en',
  published_at: { gte: '2024-01-01T00:00:00Z' },
  id: { in: ['a', 'b'] },
})
// → { language: 'en', published_at: 'gte:2024-01-01T00:00:00Z', id: 'in:a,b' }
```

## Data API Methods

| Method | Description |
|---|---|
| `getContent(slug, params)` | Single content entry by full slug |
| `getContents(params, options)` | List of content entries |
| `getBlock(blockId, params)` | Single block by ID |
| `getBlocks(params, options)` | List of blocks |
| `search(params)` | Full-text content search (`q`, `limit`, `offset`, `language`) |
| `lookupRedirect(source)` | POST redirect lookup for a given source path |
| `getRedirects(params, options)` | Redirect map (cached when `allPages: true`) |
| `getDataEntries(source, params, options)` | Entries for a data source slug |
| `getDataSources(params, options)` | List of data sources |
| `getSitemap(params, options)` | Sitemap entries (default sitemap) |
| `getNamedSitemap(name, params, options)` | Entries of a named sitemap from `settings.sitemaps` |
| `getSpace(params)` | Current space info |
| `getConfig(options)` | Config content entry (cached) |
| `syncRevision(fallbackRv)` | Sync local RV from the space |
| `clearCache()` | Clear redirect and config caches |

Pass `{ allPages: true }` as the second argument to any collection method to fetch every page automatically.

## `ApiClient` configuration

```typescript
interface B10cksApiClientOptions {
  baseUrl: string                    // Base URL of the b10cks data API (include `/api`)
  token: string                      // Space access token
  version?: 'published' | 'draft'   // Content version to fetch (default: 'published')
  rv?: string | number               // Revision token; use Date.now() to bypass CDN cache
  fetchClient?: FetchClient          // Custom fetch implementation (required in environments without globalThis.fetch)
  getRv?: () => string | number      // Custom getter for the shared revision token
  setRv?: (value: string | number) => void  // Custom setter for the shared revision token
  timeoutMs?: number                 // Per-request timeout; aborts and throws ApiError when exceeded (default: none)
  retries?: number                   // Retry attempts for transient GET failures (network/429/5xx) with backoff (default: 0)
  maxConcurrency?: number            // Max pages fetched concurrently by getAll/allPages (default: 6)
}
```

## Error handling

Non-2xx responses and transport failures throw an `ApiError` carrying the HTTP `status` (0 for network/timeout errors), the requested `endpoint`, and a best-effort parsed `body`, so you can branch on the status without string-matching the message:

```typescript
import { ApiError } from '@b10cks/client'

try {
  const content = await dataApi.getContent('missing-page')
} catch (error) {
  if (error instanceof ApiError && error.status === 404) {
    // render a 404 page
  } else {
    throw error
  }
}
```

Set `retries` to automatically retry transient failures (network errors, HTTP 429 and 5xx) on idempotent GET requests with exponential backoff, and `timeoutMs` to bound each request.

## Low-level `ApiClient`

`ApiClient` implements the `DataApiClient` interface and can be used directly for one-off requests:

```typescript
const client = new ApiClient({ baseUrl, token })

// GET with custom params — all extra keys are forwarded as query params as-is
const data = await client.get('contents', { page: 1, language_iso: 'de', vid: 'published' })

// Per-request rv override — pass rv in params to override the instance-level revision token
// (useful to bypass CDN cache for a single request without affecting other calls)
const fresh = await client.get('contents', { rv: Date.now() })

// GET all pages
const all = await client.getAll('blocks')

// POST (e.g. redirects/lookup)
const result = await client.post('redirects/lookup', { source: '/old' })
```

## Supported Endpoints

| Endpoint | Methods |
|---|---|
| `blocks` | GET (list) |
| `blocks/{id}` | GET (single) |
| `contents` | GET (list) |
| `contents/{slug}` | GET (single) |
| `datasources` | GET (list) |
| `datasources/{slug}/entries` | GET (list) |
| `redirects` | GET (list) |
| `redirects/lookup` | POST |
| `search` | GET |
| `sitemap` | GET (list) |
| `sitemaps/{name}` | GET (list) |
| `spaces/me` | GET |

## Link resolution

`resolveB10cksLink` converts a `B10cksLink` value (the union type emitted by the type generator for `link`-type fields) into a plain `{ href, target }` object. Locale prefixing and router integration are left to the caller.

```typescript
import { resolveB10cksLink } from '@b10cks/client'

const resolved = resolveB10cksLink(block.ctaLink)
// resolved: { href: 'https://example.com', target: '_blank' }
// or:       { href: 'mailto:hi@example.com', target: '_self' }
// or:       undefined  (when link is nullish or type === 'asset')
```

## Sitemap utilities

Framework-agnostic helpers for building multilingual sitemaps from `IBSitemapEntry[]`.

```typescript
import {
  buildLocalizedPath,
  filterSitemapEntries,
  renderSitemapXml,
  renderSitemapIndex,
} from '@b10cks/client'

// Build a rooted locale-prefixed path from a content entry
buildLocalizedPath('about', 'en')   // → '/en/about'
buildLocalizedPath('home', 'en')    // → '/en'
buildLocalizedPath('de/uber-uns', 'de')  // → '/de/uber-uns'  (no double prefix)

// Filter: deduplicate, drop noindex, optionally restrict to one locale
const filtered = filterSitemapEntries(entries, {
  siteUrl: 'https://example.com',
  locale: 'en',
})

// Render <urlset> XML
const xml = renderSitemapXml(filtered, 'https://example.com')

// Render <sitemapindex> XML for multi-sitemap setups
const index = renderSitemapIndex(['/sitemap-en.xml', '/sitemap-de.xml'], 'https://example.com')
```

## Preview bridge & visual editing

When a page is rendered inside the b10cks visual editor (in an `<iframe>`), the SDK exchanges `postMessage` events with the editor so blocks can be selected, hovered, and live-updated while editing. These are the framework-agnostic building blocks — the `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`, and `@b10cks/next` packages wrap them in idiomatic directives/hooks/actions.

### `previewBridge`

A singleton that bridges the preview iframe and the editor.

```typescript
import { previewBridge } from '@b10cks/client'

// Call once on the client when your app boots (the framework packages do this for you).
previewBridge.init({ allowedOrigins: ['https://app.b10cks.com'] })

previewBridge.isInPreviewMode()           // true only inside the editor iframe
previewBridge.selectItem(blockId)         // tell the editor to select a block
previewBridge.selectField(blockId, path)  // deep-select a nested field (e.g. rich text)
previewBridge.updateFieldAt(blockId, ['headline'], 'New text') // stream an inline edit

// Subscribe to editor → preview events; returns an unsubscribe function.
const off = previewBridge.on('CONTENT_UPDATE', ({ content }) => { /* … */ })
```

Event protocol:

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `SELECT_UPDATE` | both | `{ selectedItem }` | Select a block |
| `HOVER_UPDATE` | editor → preview | `{ selectedItem }` | Hover-highlight a block |
| `FIELD_SELECT` | preview → editor | `{ itemId, path }` | Deep-select a field so the editor opens its own editor |
| `FIELD_UPDATE` | preview → editor | `{ itemId, path?, field?, value }` | Stream an inline edit |
| `CONTENT_UPDATE` | editor → preview | `{ content }` | Replace the whole content tree |
| `CONTENT_PATCH` | editor → preview | `{ path, value }` | Replace a single value at `path` |

`path` is a `FieldPath` (`(string | number)[]`) that addresses any value at any depth, including array indices — e.g. `['body', 2, 'headline']`.

#### Security

By default the bridge locks onto the origin of the first message it receives (trust-on-first-use) and ignores everything else afterwards; outbound messages are then targeted to that origin instead of `*`. Pass `allowedOrigins` to `init()` to restrict the handshake to a known list of editor origins.

### Editable DOM helpers

`attachEditable` and `attachEditableField` wire a DOM element to the bridge and return a cleanup function. Both are no-ops outside preview mode.

```typescript
import { attachEditable, attachEditableField } from '@b10cks/client'

// Selectable block: click selects it; editor-driven select/hover toggle outline classes.
const detach = attachEditable(el, { id: block.id })

// Inline string field (contenteditable, streams plain-text edits):
attachEditableField(el, { id: block.id, field: 'headline' })

// Rich text / complex field — deep-select instead of editing inline:
attachEditableField(el, { id: block.id, path: ['body'], mode: 'select' })
```

### Scroll offset (fixed headers)

When a block is selected it is scrolled into view with `block: 'nearest'` (so it never jumps when already visible) and honors the `--b10cks-scroll-offset` CSS variable as `scroll-margin-top`. Set it to your fixed header's height so selection doesn't overshoot beneath it — either in CSS:

```css
:root { --b10cks-scroll-offset: 80px; }
```

or from JS (the framework packages expose a `scrollOffset` option that calls this):

```typescript
import { ensurePreviewStyles, setPreviewScrollOffset } from '@b10cks/client'

ensurePreviewStyles()        // inject the outline + scroll-margin styles once
setPreviewScrollOffset(80)   // number → px, or pass a string like '5rem'
```

### `PreviewStore` — reactive live content

`PreviewStore` is a framework-agnostic, subscribable holder for the content tree. `bindPreviewStore` feeds `CONTENT_UPDATE`/`CONTENT_PATCH` events into it, so any complex field — including rich text — re-renders from the new snapshot. The framework packages expose this as `usePreviewContent` / `createPreviewContent`.

```typescript
import { PreviewStore, bindPreviewStore, setAtPath, getAtPath } from '@b10cks/client'

const store = new PreviewStore(initialContent)
const offBridge = bindPreviewStore(store)
const off = store.subscribe(() => render(store.getSnapshot()))

// Immutable path helpers used internally — also exported for your own use:
const next = setAtPath(content, ['body', 0, 'headline'], 'New')
const value = getAtPath(content, ['body', 0, 'headline'])
```

## TypeScript

Common types exported from the package root:

```typescript
import type {
  B10cksLink,          // Union type for link fields (url | email | internal | asset)
  B10cksLinkResolved,  // Return type of resolveB10cksLink
  IBContent,           // A content entry (generic: IBContent<YourContentShape>)
  IBContentBlock,      // Base block shape with id and block fields
  IBBlock,             // A block schema
  IBDataEntry,         // A data source entry (key/value)
  IBDataSource,        // A data source definition
  IBSitemapEntry,      // Sitemap entry with full_slug, language_iso, meta, published_at
  IBSeoMeta,           // robots and canonical fields
  IBSpace,             // Space info
  IBRedirect,          // Redirect rule (source, target, status_code)
  IBSearchResult,      // Search result extending IBContent with relevance_score
  IBSearchResponse,    // Wrapper around IBSearchResult[]
  IBCollectionResponse,// Paginated list envelope
  IBMeta,              // Pagination metadata (total, last_page, per_page, …)
  IBResponse,          // Single-item envelope { data, rv }
  B10cksApiClientOptions,
} from '@b10cks/client'
```

## License

MIT
