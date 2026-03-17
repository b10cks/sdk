# @b10cks/client

Core API client for b10cks, a headless CMS and content management platform.

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

// Fetch all contents with pagination
const contents = await dataApi.getContents({ vid: 'published' })

// Fetch a specific content entry
const content = await dataApi.getContent('home', { vid: 'draft' })

// Fetch specific datasource entries
const entries = await dataApi.getDataEntries('my-datasource')
```

## Features

- **Simple HTTP Client**: Type-safe API client for b10cks endpoints
- **Framework-Agnostic Data API**: Shared `B10cksDataApi` used by all framework SDKs
- **Pagination Support**: Automatic handling of paginated responses
- **Revision Tracking**: Built-in support for revision (RV), with VID passed explicitly in request params
- **Flexible Fetch**: Use browser fetch, Node fetch, or a custom fetch implementation

## API Methods

- `get<T>(endpoint, params)` - Fetch single page of data
- `getAll<T>(endpoint, params)` - Fetch all data across pages

## Data API Methods

- `getContent(fullSlug, params)` - pass `vid` in `params` when needed
- `getContents(params)` - pass `vid` in `params` when needed
- `getBlocks(params)`
- `getDataEntries(source, params)`
- `getDataSources(params)`
- `getSpace(params)`
- `getRedirects(params, forceRefresh)`
- `getConfig(options)`
- `syncRevision(fallbackRv)`

## Supported Endpoints

- `blocks` - Content blocks
- `contents` - Content items
- `contents/{id}` - Specific content
- `datasources` - Data sources
- `datasources/{id}/entries` - Datasource entries
- `spaces/me` - Current space info

## License

MIT
