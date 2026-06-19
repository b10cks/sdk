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
})

const dataApi = createB10cksDataApi(client)

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
| `getSitemap(params, options)` | Sitemap entries |
| `getSpace(params)` | Current space info |
| `getConfig(options)` | Config content entry (cached) |
| `syncRevision(fallbackRv)` | Sync local RV from the space |
| `clearCache()` | Clear redirect and config caches |

Pass `{ allPages: true }` as the second argument to any collection method to fetch every page automatically.

## Low-level `ApiClient`

`ApiClient` implements the `DataApiClient` interface and can be used directly for one-off requests:

```typescript
const client = new ApiClient({ baseUrl, token })

// GET with custom params
const data = await client.get('contents', { page: 1, language: 'de' })

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
| `spaces/me` | GET |

## License

MIT
