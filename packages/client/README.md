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
  rv: 0, // revision token — pass Date.now() to bypass CDN cache
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

| Operator object          | Wire format | Meaning               |
| ------------------------ | ----------- | --------------------- |
| `'value'`                | `value`     | Exact match           |
| `{ eq: 'v' }`            | `eq:v`      | Exact match           |
| `{ neq: 'v' }`           | `neq:v`     | Not equal             |
| `{ in: ['a','b'] }`      | `in:a,b`    | One of                |
| `{ '!in': ['a','b'] }`   | `!in:a,b`   | None of               |
| `{ like: 'v' }`          | `like:v`    | Contains              |
| `{ '!like': 'v' }`       | `!like:v`   | Does not contain      |
| `{ '^like': 'v' }`       | `^like:v`   | Starts with           |
| `{ 'like$': 'v' }`       | `like$:v`   | Ends with             |
| `{ gte: 'v' }`           | `gte:v`     | Greater than or equal |
| `{ gt: 'v' }`            | `gt:v`      | Greater than          |
| `{ lte: 'v' }`           | `lte:v`     | Less than or equal    |
| `{ lt: 'v' }`            | `lt:v`      | Less than             |
| `{ between: ['a','b'] }` | `a...b`     | Range (dates)         |
| `{ null: true }`         | `null:`     | Is null               |
| `{ '!null': true }`      | `!null:`    | Is not null           |

### Content sort

`sort` accepts a string or a typed array of `ContentSortItem` values. Prefix with `-` for descending order. JSON content fields are supported via `content.{field}`.

```typescript
sort: '-published_at' // single field, descending
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

| Method                                    | Description                                                   |
| ----------------------------------------- | ------------------------------------------------------------- |
| `getContent(slug, params)`                | Single content entry by full slug                             |
| `getContents(params, options)`            | List of content entries                                       |
| `getBreadcrumb(slug, params)`             | Ancestor trail of an entry, root first                        |
| `getBreadcrumbResponse(slug, params)`     | Same trail, with the response's `meta` block                  |
| `getBlock(blockId, params)`               | Single block by ID                                            |
| `getBlocks(params, options)`              | List of blocks                                                |
| `search(params)`                          | Full-text content search (`q`, `limit`, `offset`, `language`) |
| `lookupRedirect(source)`                  | POST redirect lookup for a given source path                  |
| `getRedirects(params, options)`           | Redirect map (cached when `allPages: true`)                   |
| `getDataEntries(source, params, options)` | Entries for a data source slug                                |
| `getDataSources(params, options)`         | List of data sources                                          |
| `getSitemap(params, options)`             | Sitemap entries (default sitemap)                             |
| `getNamedSitemap(name, params, options)`  | Entries of a named sitemap from `settings.sitemaps`           |
| `getSpace(params)`                        | Current space info                                            |
| `getConfig(options)`                      | Config entry content plus its `id` (cached)                   |
| `syncRevision(fallbackRv)`                | Sync local RV from the space                                  |
| `clearCache()`                            | Clear redirect and config caches                              |

Pass `{ allPages: true }` as the second argument to any collection method to fetch every page automatically.

Every collection method normalizes the response envelope, so a bare array, a
`{ data }` wrapper and a `{ data: { data } }` wrapper all resolve to a plain
array. There is no need to unwrap by hand.

### Common query params

`rv` pins a request to a content revision. It defaults to the client's current
revision, so pass it only to override — `Date.now()` from a server route
sidesteps a stale delivery cache:

```typescript
const entries = await dataApi.getContents({ language_iso: 'de', rv: Date.now() })
```

`getDataEntries` takes `dimension` to read a mutated variant of a data source,
falling back to the stored base value for keys the dimension does not override:

```typescript
const strings = await dataApi.getDataEntries('translations', { dimension: 'fr' })
```

Filtering by `id`, `canonical_id`, `canonical_parent_id`, `parent_id` and
`include_fallback` goes through `filter` — see [Typed Filters](#typed-filters).
`filter: { canonical_id: { in: [...] } }` serializes to the same
`canonical_id=in:a,b` the API expects, so there is no reason to build that
string yourself.

## `ApiClient` configuration

```typescript
interface B10cksApiClientOptions {
  baseUrl: string // Base URL of the b10cks data API (include `/api`)
  token: string // Space access token
  version?: 'published' | 'draft' // Content version to fetch (default: 'published')
  rv?: string | number // Revision token; use Date.now() to bypass CDN cache
  fetchClient?: FetchClient // Custom fetch implementation (required in environments without globalThis.fetch)
  getRv?: () => string | number // Custom getter for the shared revision token
  setRv?: (value: string | number) => void // Custom setter for the shared revision token
  timeoutMs?: number // Timeout per attempt, including reading the body; throws ApiError with status 0 (default: none)
  retries?: number // Retry attempts for transient GET failures (network/timeout/429/5xx) (default: 0)
  maxConcurrency?: number // Max pages fetched concurrently by getAll/allPages (default: 6)
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

Set `retries` to retry transient failures (network errors, timeouts, HTTP 429 and 5xx) on GET requests. The client waits as long as a `Retry-After` header asks, up to 10 seconds, and otherwise backs off exponentially (200 ms, 400 ms, …). Other statuses, invalid JSON and aborts are never retried, and POST requests are never retried. `timeoutMs` bounds each attempt from the request until its body is read.

Errors thrown by a custom fetch client, like Nuxt's `$fetch`, become an `ApiError` too, with the status and parsed body they carry. Error messages name the endpoint and never contain the request URL, so the access token stays out of logs.

### Cancelling requests

Every data API method takes a `signal` in its options (the last argument; for `getConfig`, its only argument). Aborting cancels the request, a pending retry, and for `allPages` the pages still loading. The call rejects with the signal's reason. A failed page of an `allPages` request also cancels the pages still loading.

```typescript
const controller = new AbortController()
const entry = dataApi.getContent('home', {}, { signal: controller.signal })
const all = dataApi.getContents({}, { allPages: true, signal: controller.signal })
controller.abort()
```

Slugs and ids are encoded per path segment, so `?`, `#` and `%` in a slug can't change the request. A `.` or `..` segment is rejected with a `TypeError`.

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

// Cancel with a signal
const space = await client.get('spaces/me', {}, { signal: controller.signal })

// POST (e.g. redirects/lookup)
const result = await client.post('redirects/lookup', { source: '/old' })
```

## Supported Endpoints

| Endpoint                     | Methods      |
| ---------------------------- | ------------ |
| `blocks`                     | GET (list)   |
| `blocks/{id}`                | GET (single) |
| `breadcrumbs/{slug}`         | GET (single) |
| `contents`                   | GET (list)   |
| `contents/{slug}`            | GET (single) |
| `datasources`                | GET (list)   |
| `datasources/{slug}/entries` | GET (list)   |
| `redirects`                  | GET (list)   |
| `redirects/lookup`           | POST         |
| `search`                     | GET          |
| `sitemap`                    | GET (list)   |
| `sitemaps/{name}`            | GET (list)   |
| `spaces/me`                  | GET          |

## Link resolution

`resolveB10cksLink` converts a `B10cksLink` value (the union type emitted by the type generator for `link`-type fields) into a plain `{ href, target }` object. Locale prefixing and router integration are left to the caller.

```typescript
import { resolveB10cksLink } from '@b10cks/client'

const resolved = resolveB10cksLink(block.ctaLink)
// resolved: { href: 'https://example.com', target: '_blank' }
// or:       { href: 'mailto:hi@example.com', target: '_self' }
// or:       undefined  (when link is nullish or type === 'asset')
```

`url` and `internal` links get their `params` as a query string and their `anchor` as a fragment, in that order: `/about?ref=nav#01kh6h981yh1s5z7s3f80wmrw2`. An href that already has a `#` keeps its fragment.

Hrefs go through the same URL policy as rich text links: a scheme outside `http`, `https`, `mailto` and `tel` (like `javascript:`) turns the href into `#`. Relative URLs always pass. Pass the allowlist as the second argument to change it:

```typescript
resolveB10cksLink(block.ctaLink, { allowedSchemes: ['https', 'mailto'] })
```

### Block anchors

An internal link `anchor` is the target block's `id`. The page has to render that id on the block's element for the browser to scroll there. The framework SDKs do this for you (`v-editable` in Vue, `B10cksComponent` in React). For blocks rendered without them, spread `blockAnchorAttrs`:

```typescript
import { blockAnchorAttrs } from '@b10cks/client'

blockAnchorAttrs(block) // { id: block.id }, or {} when the block has no id
```

Block ids are lowercase ULIDs and can start with a digit, which is not a valid CSS id selector. Use `document.getElementById(id)`, or `querySelector('#' + CSS.escape(id))`.

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
buildLocalizedPath('about', 'en') // → '/en/about'
buildLocalizedPath('home', 'en') // → '/en'
buildLocalizedPath('de/uber-uns', 'de') // → '/de/uber-uns'  (no double prefix)

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

### Locale prefixing

Entries always carry a `language_iso`, even in a space that only has one
language, so prefixing on it unconditionally would emit `/en/about` for a page
served at `/about`. `localePrefix` controls that, and defaults to `auto`:
prefix only when the entries span more than one language.

| Value            | Behaviour                                                     |
| ---------------- | ------------------------------------------------------------- |
| `auto` (default) | Prefix only when the entry set is multilingual                |
| `always`         | Prefix every entry                                            |
| `never`          | Use paths as stored, for an app that routes the locale itself |
| `except-default` | Prefix every locale but `defaultLocale`                       |

```typescript
// Nuxt i18n `prefix_except_default`
const xml = renderSitemapXml(filtered, 'https://example.com', {
  localePrefix: 'except-default',
  defaultLocale: 'en',
})
```

`filterSitemapEntries` takes the same options, so its dedupe key matches the
paths you go on to render.

### Building a sitemap in a server route

The data API paginates and unwraps for you, so a nitro route is short. In Nuxt,
`useB10cksServerApi()` from `@b10cks/nuxt` hands you the same data API:

```typescript
// server/routes/sitemap.xml.ts
export default defineEventHandler(async (event) => {
  const api = useB10cksServerApi()
  const entries = await api.getSitemap({}, { allPages: true })
  const siteUrl = getRequestURL(event).origin

  setHeader(event, 'content-type', 'application/xml')
  return renderSitemapXml(filterSitemapEntries(entries, { siteUrl }), siteUrl)
})
```

## Breadcrumbs

`getBreadcrumb(slug, params)` returns the ancestor trail of an entry, ordered from the tree root down to the entry itself. The entry is addressed by full slug or by content id.

```typescript
const trail = await dataApi.getBreadcrumb('products/shoes', { language: 'de' })

trail.map((level) => [level.name, level.path])
// → [['Startseite', '/de/startseite'], ['Produkte', '/de/startseite/produkte'], …]
```

Every level is resolved through its own i18n family, so an ancestor without a translation is served from the fallback language and flagged with `is_fallback` — `resolved_language_iso` says which language it actually came from, while `path` always carries the _requested_ locale segment.

Unpublished ancestors are omitted from the trail rather than blanked, so the position in the array is not the position in the tree: read `depth` for that, and pass `ancestors: 'all'` when structural levels are never published by design.

| Parameter                   | Default       | Description                                                          |
| --------------------------- | ------------- | -------------------------------------------------------------------- |
| `language` / `language_iso` | space default | Language every level is resolved for                                 |
| `vid`                       | `published`   | `published` or `draft` — a version id is not accepted                |
| `include_self`              | `true`        | Include the requested entry as the last level                        |
| `ancestors`                 | `published`   | `all` also returns unpublished ancestors                             |
| `translations`              | `false`       | Add published sibling translations per level                         |
| `include_content`           | `false`       | Add the resolved `content` payload per level; honors `take`/`except` |

Use `getBreadcrumbResponse` when you need the `meta` block (resolved language, its fallback, the space's i18n mode, and the root/current ids).

`breadcrumbJsonLd` renders a trail as a schema.org `BreadcrumbList` for an `application/ld+json` script tag. It numbers items consecutively, independent of the `depth` gaps a dropped ancestor leaves behind:

```typescript
import { breadcrumbJsonLd } from '@b10cks/client'

const jsonLd = breadcrumbJsonLd(trail, { siteUrl: 'https://example.com' })
// { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [...] }
```

## Preview bridge & visual editing

When a page is rendered inside the b10cks visual editor (in an `<iframe>`), the SDK exchanges `postMessage` events with the editor so blocks can be selected, hovered, and live-updated while editing. These are the framework-agnostic building blocks — the `@b10cks/vue`, `@b10cks/react`, `@b10cks/svelte`, `@b10cks/nuxt`, and `@b10cks/next` packages wrap them in idiomatic directives/hooks/actions.

### `previewBridge`

A singleton that bridges the preview iframe and the editor.

```typescript
import { previewBridge } from '@b10cks/client'

// Call once on the client when your app boots (the framework packages do this for you).
previewBridge.init({ allowedOrigins: ['https://app.b10cks.com'] })

previewBridge.isInPreviewMode() // true only inside the editor iframe
previewBridge.selectItem(blockId) // tell the editor to select a block
previewBridge.selectField(blockId, path) // deep-select a nested field (e.g. rich text)
previewBridge.updateFieldAt(blockId, ['headline'], 'New text') // stream an inline edit

// Subscribe to editor → preview events; returns an unsubscribe function.
const off = previewBridge.on('CONTENT_UPDATE', ({ content }) => {
  /* … */
})
```

Event protocol:

| Event            | Direction        | Payload                            | Purpose                                                |
| ---------------- | ---------------- | ---------------------------------- | ------------------------------------------------------ |
| `SELECT_UPDATE`  | both             | `{ selectedItem }`                 | Select a block                                         |
| `HOVER_UPDATE`   | editor → preview | `{ selectedItem }`                 | Hover-highlight a block                                |
| `FIELD_SELECT`   | preview → editor | `{ itemId, path }`                 | Deep-select a field so the editor opens its own editor |
| `FIELD_UPDATE`   | preview → editor | `{ itemId, path?, field?, value }` | Stream an inline edit                                  |
| `CONTENT_UPDATE` | editor → preview | `{ content }`                      | Replace the whole content tree                         |
| `CONTENT_PATCH`  | editor → preview | `{ path, value }`                  | Replace a single value at `path`                       |
| `FIELD_CONFIG`   | editor → preview | `{ itemId, path, richtext }`       | Allow in-place editing of a rich text field            |
| `HIDDEN_BLOCKS`  | editor → preview | `{ ids }`                          | Ids of all hidden blocks, to dim them                  |

`path` is a `FieldPath` (`(string | number)[]`) that addresses any value at any depth, including array indices — e.g. `['body', 2, 'headline']`. The preview ignores paths longer than 64 segments, a `__proto__` key, and indices past the end of an array (appending at the end works), so a message can't change an object's prototype or create a huge sparse array.

#### Security

By default the bridge locks onto the origin of the first message it receives (trust-on-first-use) and ignores everything else afterwards; outbound messages are then targeted to that origin instead of `*`. Pass `allowedOrigins` to `init()` to restrict the handshake to a known list of editor origins.

### Editable DOM helpers

`attachEditable` and `attachEditableField` wire a DOM element to the bridge and return a cleanup function. Both are no-ops outside preview mode.

```typescript
import { attachEditable, attachEditableField } from '@b10cks/client'

// Selectable block: click selects it in the editor, labelled with the block type.
const detach = attachEditable(el, { id: block.id, label: block.block })

// Inline string field (contenteditable, streams plain-text edits):
attachEditableField(el, { id: block.id, field: 'headline' })

// Inline text inside an array: update only this action's label.
attachEditableField(button, { id: block.id, path: ['actions', index, 'label'], mode: 'inline' })

// Complex field — deep-select instead of editing inline:
attachEditableField(el, { id: block.id, path: ['link'] })
```

Path-only fields and fields wrapping links or buttons select the CMS field by default. Pass `mode: 'inline'` for a path to a string value. The SDK lets an inline field inside a selectable link receive focus and blocks the link click while editing. An inline edit targeting the whole `actions` array would replace the array with text.

In the editor, a click on an editable element selects it and nothing else: it is intercepted before any handler on the page, so links, buttons, and router links inside a block don't fire. Clicks outside editables behave as usual.

Two kinds of elements let the click through after selecting:

- **Text edited in place**, like an inline field or a rich text field being edited: the first click selects the block like a click anywhere else in it, and the caret lands where you clicked. Later clicks only move the caret.
- **Interactive blocks**: pass `interactive: true` for components whose own clicks matter in the editor, like accordions, tabs or carousels. Clicks inside select the block and then reach the page, so the accordion still opens. Links and form submit buttons inside it still don't navigate.

```typescript
attachEditable(el, { id: block.id, label: block.block, interactive: true })
```

Selection and hover are drawn in an overlay layer, in a shadow root above the page, so your styles and layout stay untouched. Only the innermost editable is highlighted, with a label: the block type for blocks (`hero_section` reads as `Hero section`), the field name for `select`-mode fields. Pass `label` to override it. The highlighted elements also get the `b10cks-selected` and `b10cks-hover` classes if you want to add your own styling. Blocks the editor hides get `b10cks-hidden` and are shown at reduced opacity; they stay in the preview and selectable.

To use the page itself, hold Alt (Option on macOS) while clicking: the click then reaches the page and selects nothing, so editors can open tabs, accordions, or carousels. Some macOS browsers download a link on Option-click.

The selection label carries the editing tools:

- **Breadcrumb**: the blocks around the selection, like `Page › Hero › Card`. Click one to select it. Long chains keep the three closest ancestors.
- **Quick actions** for blocks: move up, move down, add a block before or after, duplicate, hide or show, delete. They ask the editor through `previewBridge.blockAction`, and the editor applies them and sends the new content. They show only for editors on bridge protocol 1 or later, which send `BLOCK_LABELS`; older editors couldn't run them. Move up and down are disabled when there is no sibling block on that side. Hide and show need an editor that sends `HIDDEN_BLOCKS` (bridge protocol 2); with older editors the toggle isn't shown.
- **Drag handle**: drag it to drop the block before or after another block, shown by a line. Dropping on the block itself, inside it, or on one of its ancestors does nothing. Escape cancels. The drop calls `previewBridge.moveBlock`, and the editor rejects moves its schema doesn't allow.
- **Keyboard**, while the preview has focus and not while typing in a form field or contenteditable: Escape selects the parent block, ArrowUp and ArrowDown the previous and next sibling block.

Siblings are the block editables that share the same parent block editable. A block the page renders without an editable is invisible to the preview, so wire up every block you want editors to reach.

### Rich text fields

`attachRichTextField` makes an element showing a rendered rich text field editable in place. The framework packages' `B10cksRichText` does this for you through its `editable` prop; use it directly for your own renderer:

```typescript
import { attachRichTextField } from '@b10cks/client'

el.innerHTML = renderRichText(block.body, options)
const field = attachRichTextField(el, {
  id: block.id,
  path: ['body'],
  document: block.body,
  render: options,
  // While editing, the editor owns the element: don't re-render its HTML.
  onEditingChange: (editing) => (paused = editing),
})

field.update(nextBody) // whenever the document changes, e.g. from usePreviewContent
field.setRender(nextOptions) // whenever the render options change
field.destroy()
```

A click selects the field like `select` mode does. When the editor answers with `FIELD_CONFIG` (the user may edit the field), the element turns into a Tiptap editor with the b10cks schema, loaded with a dynamic `import()` of `@b10cks/richtext/editor` on the first hover or click. Without that answer, from an older editor or for read-only users, the field stays select-only. Tiptap is never loaded outside preview mode.

- Edits go to the editor as `FIELD_UPDATE` at most every 300 ms and on blur, and into the preview's own content store through `previewBridge.patchLocal`, since the editor doesn't echo them.
- Documents passed to `update` while editing are merged into the editor without moving the caret. Copies of edits this field sent are ignored.
- Clicks inside the editor reach it, and Escape returns to block selection. Selecting anything else ends editing and leaves the element rendered.

### Scroll offset (fixed headers)

When a block is selected it is scrolled into view with `block: 'nearest'` (so it never jumps when already visible) and honors the `--b10cks-scroll-offset` CSS variable as `scroll-margin-top`. Set it to your fixed header's height so selection doesn't overshoot beneath it — either in CSS:

```css
:root {
  --b10cks-scroll-offset: 80px;
}
```

or from JS (the framework packages expose a `scrollOffset` option that calls this):

```typescript
import { ensurePreviewStyles, setPreviewScrollOffset } from '@b10cks/client'

ensurePreviewStyles() // inject the scroll-margin styles once
setPreviewScrollOffset(80) // number → px, or pass a string like '5rem'
```

### `PreviewStore` — reactive live content

`PreviewStore` is a framework-agnostic, subscribable holder for the content tree. `bindPreviewStore` feeds `CONTENT_UPDATE`/`CONTENT_PATCH` events into it, so any complex field — including rich text — re-renders from the new snapshot. The framework packages expose this as `usePreviewContent` / `createPreviewContent`.

The editor sends `CONTENT_UPDATE` scoped to the block that changed, carrying that block's `id`; only an edit of the root block pushes the whole tree (as `{ id: entryId, …entryContent }`). The store therefore merges an update by `id`:

- payload without an `id` → treated as the whole tree
- id equal to the root's id → replaces the root
- id found in the tree → replaces that node in place, immutably
- id found nowhere → ignored, so a scoped update can never collapse the page

Give the root block the entry's id with `toRootBlock` so root-level edits match it; when the root has no id, an update whose `block` type equals the root's is taken as the root.

```typescript
import { PreviewStore, bindPreviewStore, setAtPath, getAtPath, toRootBlock } from '@b10cks/client'

// `entry.content` has no id of its own — the id lives on the entry.
const initialContent = toRootBlock(entry) // { ...entry.content, id, block }

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
  B10cksLink, // Union type for link fields (url | email | internal | asset)
  B10cksLinkResolved, // Return type of resolveB10cksLink
  IBContent, // A content entry (generic: IBContent<YourContentShape>)
  IBContentBlock, // Base block shape with id and block fields
  IBBlock, // A block schema
  IBDataEntry, // A data source entry (key/value)
  IBDataSource, // A data source definition
  IBSitemapEntry, // Sitemap entry with full_slug, language_iso, meta, published_at
  IBSeoMeta, // robots and canonical fields
  IBSpace, // Space info
  IBRedirect, // Redirect rule (source, target, status_code)
  IBSearchResult, // Search result extending IBContent with relevance_score
  IBSearchResponse, // Wrapper around IBSearchResult[]
  IBCollectionResponse, // Paginated list envelope
  IBMeta, // Pagination metadata (total, last_page, per_page, …)
  IBResponse, // Single-item envelope { data, rv }
  B10cksApiClientOptions,
} from '@b10cks/client'
```

## License

MIT
