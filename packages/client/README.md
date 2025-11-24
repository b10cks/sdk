# @b10cks/client

A lightweight, type-safe API client for the b10cks CMS. This is the core SDK that all other b10cks packages depend on.

## Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Lightweight**: Zero external dependencies, minimal bundle size
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS
- **Flexible HTTP Client**: Bring your own fetch implementation
- **Pagination Support**: Built-in support for paginated API responses
- **Revision Tracking**: Automatic tracking of content revisions
- **ESM/CJS**: Dual export support for maximum compatibility

## Installation

```bash
npm install @b10cks/client
# or
pnpm add @b10cks/client
# or
yarn add @b10cks/client
```

## Quick Start

```typescript
import { ApiClient } from '@b10cks/client'

// Initialize the client
const client = new ApiClient(
  {
    baseUrl: 'https://api.b10cks.io',
    token: 'your-api-token',
    fetchClient: fetch, // Use native fetch or your preferred HTTP client
    version: 'published', // 'draft' or 'published'
  },
  new URL(window.location.href)
)

// Fetch a single content item
const content = await client.get('contents/my-page')

// Fetch all items in a collection with pagination
const allBlocks = await client.getAll('blocks')
```

## API

### Constructor

```typescript
new ApiClient(options, url)
```

**Options:**
- `baseUrl` (string, required): The b10cks API base URL
- `token` (string, required): Your API authentication token
- `fetchClient` (function, required): The fetch function to use for HTTP requests
- `version` ('draft' | 'published', optional): Content version to fetch. Defaults to 'published'
- `rv` (string | number, optional): Initial revision number
- `getRv` (function, optional): Custom function to retrieve the current revision
- `setRv` (function, optional): Custom function to store the current revision

**URL Parameter:**
The second parameter should be a URL object that may contain b10cks-specific query parameters:
- `b10cks_vid`: Version ID override
- `b10cks_rv`: Revision number override

### Methods

#### `get<T>(endpoint: Endpoint, params?: Params): Promise<T>`

Fetch a single resource from the API.

```typescript
const block = await client.get<IBBlock>('blocks', { sort: 'name' })
```

#### `getAll<T>(endpoint: Endpoint, params?: Params): Promise<T[]>`

Fetch all items from a paginated endpoint. Automatically handles pagination.

```typescript
const allContents = await client.getAll<IBContent>('contents', {
  language_iso: 'en',
})
```

### Supported Endpoints

- `'blocks'` - List all blocks/components
- `'contents'` - List all content items
- `'contents/{slug}'` - Get a specific content item by slug
- `'datasources'` - List all data sources
- `'datasources/{slug}/entries'` - Get entries from a data source
- `'spaces/me'` - Get current space information

### Type Definitions

#### IBResponse<T>

Single resource response:

```typescript
interface IBResponse<T> {
  data: T
  rv?: string | number
}
```

#### IBCollectionResponse<T>

Paginated collection response:

```typescript
interface IBCollectionResponse<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}
```

#### IBContent<T>

A content item from the b10cks API:

```typescript
interface IBContent<Content = any> {
  id: string
  slug: string
  name: string
  content: Content
  type: string
  parent_id: string | null
  full_slug: string
  language_iso: string
  published_at: string | null
  created_at: string
  updated_at: string
}
```

## Advanced Usage

### Custom HTTP Client

You can provide any fetch-compatible HTTP client:

```typescript
import { ApiClient } from '@b10cks/client'
import axios from 'axios'

const client = new ApiClient(
  {
    baseUrl: 'https://api.b10cks.io',
    token: 'your-token',
    fetchClient: (url) => axios.get(url).then(r => r.data),
  },
  new URL('https://example.com')
)
```

### Revision Tracking

By default, revisions are stored in memory. For SSR or multi-tab scenarios, provide custom getters/setters:

```typescript
const client = new ApiClient(
  {
    baseUrl: 'https://api.b10cks.io',
    token: 'your-token',
    fetchClient: fetch,
    getRv: () => localStorage.getItem('b10cks_rv') || 0,
    setRv: (value) => localStorage.setItem('b10cks_rv', String(value)),
  },
  new URL(window.location.href)
)
```

### Query Parameters

Pass additional query parameters to API calls:

```typescript
const contents = await client.getAll('contents', {
  page: 1,
  per_page: 50,
  language_iso: 'en',
  type: 'blog_post',
})
```

## Error Handling

The client will throw errors if the API returns an error response. Handle them appropriately:

```typescript
try {
  const content = await client.get('contents/not-found')
} catch (error) {
  console.error('Failed to fetch content:', error)
}
```

## Browser Support

This package requires a runtime with:
- ES2020+ support
- Native Promise support
- Fetch API (or a fetch polyfill)

## License

MIT
