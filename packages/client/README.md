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
  fetchClient: fetch,
})

const dataApi = createB10cksDataApi(client)

// Fetch blocks
const blocks = await dataApi.getBlocks()

// Fetch the first page of contents
const contents = await dataApi.getContents({ vid: 'published', page: 1, per_page: 20 })

// Fetch all contents across all pages
const allContents = await dataApi.getContents(
  { vid: 'published', per_page: 100 },
  { allPages: true }
)

// Fetch a specific content entry
const content = await dataApi.getContent('home', { vid: 'draft' })

// Fetch specific datasource entries
const entries = await dataApi.getDataEntries('my-datasource')

// Fetch sitemap entries
const sitemap = await dataApi.getSitemap({ vid: 'published' })
```

## Features

- **Simple HTTP Client**: Type-safe API client for b10cks endpoints
- **Framework-Agnostic Data API**: Shared `B10cksDataApi` used by all framework SDKs
- **Pagination Support**: Fetch a specific page by default, or opt into fetching all pages
- **Revision Tracking**: Built-in support for revision (RV), with VID passed explicitly in request params
- **Flexible Fetch**: Use browser fetch, Node fetch, or a custom fetch implementation

## API Methods

- `get<T>(endpoint, params)` - Fetch single page of data
- `getAll<T>(endpoint, params)` - Fetch all data across pages

## Data API Methods

- `getContent(fullSlug, params)` - pass `vid` in `params` when needed
- `getContents(params, options)` - `params` supports `page` and `per_page`; set `options.allPages` to `true` to fetch every page
- `getBlocks(params, options)` - `params` supports `page` and `per_page`
- `getDataEntries(source, params, options)` - `params` supports `page` and `per_page`
- `getDataSources(params, options)` - `params` supports `page` and `per_page`
- `getSitemap(params, options)` - pass `vid` in `params`; `params` also supports `page` and `per_page`
- `getSpace(params)`
- `getRedirects(params, forceRefresh | { forceRefresh?, allPages? })` - `params` supports `page` and `per_page`
- `getConfig(options)`
- `syncRevision(fallbackRv)`

## Supported Endpoints

- `blocks` - Content blocks
- `contents` - Content items
- `contents/{id}` - Specific content
- `datasources` - Data sources
- `datasources/{id}/entries` - Datasource entries
- `sitemap` - Sitemap entries
- `spaces/me` - Current space info

## License

MIT
