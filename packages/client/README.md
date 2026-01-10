# @b10cks/client

Core API client for b10cks, a headless CMS and content management platform.

## Installation

```bash
npm install @b10cks/client
```

## Usage

```typescript
import { ApiClient } from '@b10cks/client'

const client = new ApiClient(
  {
    baseUrl: 'https://api.b10cks.com/api',
    token: 'your-access-token',
    fetchClient: fetch,
  },
  new URL(window.location.href)
)

// Fetch blocks
const blocks = await client.get('blocks')

// Fetch all contents with pagination
const contents = await client.getAll('contents')

// Fetch specific datasource entries
const entries = await client.get('datasources/my-datasource/entries')
```

## Features

- **Simple HTTP Client**: Type-safe API client for b10cks endpoints
- **Pagination Support**: Automatic handling of paginated responses
- **Revision Tracking**: Built-in support for revision (RV) and version (VID) parameters
- **Flexible Fetch**: Use any fetch implementation (browser, Node.js, custom)

## API Methods

- `get<T>(endpoint, params)` - Fetch single page of data
- `getAll<T>(endpoint, params)` - Fetch all data across pages

## Supported Endpoints

- `blocks` - Content blocks
- `contents` - Content items
- `contents/{id}` - Specific content
- `datasources` - Data sources
- `datasources/{id}/entries` - Datasource entries
- `spaces/me` - Current space info

## License

MIT
