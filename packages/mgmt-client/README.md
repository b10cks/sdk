# @b10cks/mgmt-client

Management API client for b10cks - A TypeScript client for managing your b10cks resources.

## Installation

```bash
npm install @b10cks/mgmt-client
```

```bash
pnpm add @b10cks/mgmt-client
```

```bash
yarn add @b10cks/mgmt-client
```

## Quick Start

```typescript
import { ManagementClient } from '@b10cks/mgmt-client'

const client = new ManagementClient({
  baseUrl: 'https://api.b10cks.com',
  token: 'your-bearer-token',
})

const user = await client.users.getMe()
console.log(user)
```

## Configuration

The client accepts the following configuration options:

```typescript
interface ClientConfig {
  baseUrl: string      // Base URL of the b10cks API
  token: string        // Bearer token for authentication
  timeout?: number     // Request timeout in milliseconds (default: 30000)
}
```

## API Resources

### Users

Manage user account information.

```typescript
// Get current user
const user = await client.users.getMe()

// Update current user
await client.users.updateMe({
  firstname: 'John',
  lastname: 'Doe',
})

// Update user avatar
await client.users.updateAvatar({
  avatar: 'base64-encoded-image',
})

// Update password
await client.users.updatePassword({
  old_password: 'current-password',
  password: 'new-password',
})

// Update user settings
await client.users.updateSettings()
```

### Teams

Manage teams and team hierarchies.

```typescript
// List all teams
const teams = await client.teams.list()

// Create a team
const team = await client.teams.create({
  name: 'Marketing Team',
  color: '#FF5733',
  description: 'Our marketing team',
})

// Get a specific team
const team = await client.teams.get('team-id')

// Update a team
await client.teams.update('team-id', {
  name: 'Updated Team Name',
  color: '#00FF00',
})

// Delete a team
await client.teams.delete('team-id')

// Get team hierarchy
const hierarchy = await client.teams.getHierarchy()

// Manage team users
await client.teams.addUser('team-id')
await client.teams.updateUser('team-id', 'user-id')
await client.teams.removeUser('team-id', 'user-id')
```

### Spaces

Manage spaces within your organization.

```typescript
// Create a space
const space = await client.spaces.create({
  name: 'My Space',
  slug: 'my-space',
  color: '#4A90E2',
})

// Get a space
const space = await client.spaces.get('space-id')

// Update a space
await client.spaces.update('space-id', {
  name: 'Updated Space',
  slug: 'updated-space',
  state: 'active',
})

// Delete a space
await client.spaces.delete('space-id')

// Update space icon
await client.spaces.updateIcon('space-id', {
  icon: 'base64-encoded-icon',
})

// Archive a space
await client.spaces.archive('space-id')

// Get space statistics
const stats = await client.spaces.getStats('space-id')

// Get AI usage for a space
const aiUsage = await client.spaces.getAiUsage('space-id')
```

### Blocks

Manage content blocks within spaces.

```typescript
// List blocks in a space
const blocks = await client.blocks.list('space-id', {
  page: 1,
  per_page: 20,
  search: 'blog',
  type: 'article',
  sort: '-created_at',
})

// Create a block
const block = await client.blocks.create('space-id')

// Get a block
const block = await client.blocks.get('space-id', 'block-id')

// Update a block
await client.blocks.update('space-id', 'block-id')

// Delete a block
await client.blocks.delete('space-id', 'block-id')
```

### Block Tags

Organize blocks with tags.

```typescript
// List block tags
const tags = await client.blockTags.list('space-id')

// Create a tag
const tag = await client.blockTags.create('space-id')

// Get a tag
const tag = await client.blockTags.get('space-id', 'tag-id')

// Update a tag
await client.blockTags.update('space-id', 'tag-id')

// Delete a tag
await client.blockTags.delete('space-id', 'tag-id')
```

### Block Folders

Organize blocks in folder structures.

```typescript
// List folders
const folders = await client.blockFolders.list('space-id')

// Create a folder
const folder = await client.blockFolders.create('space-id')

// Get a folder
const folder = await client.blockFolders.get('space-id', 'folder-id')

// Update a folder
await client.blockFolders.update('space-id', 'folder-id')

// Delete a folder
await client.blockFolders.delete('space-id', 'folder-id')
```

### Contents

Manage content entries and their versions.

```typescript
// List contents
const contents = await client.contents.list('space-id', {
  page: 1,
  per_page: 20,
  block_id: 'block-id',
  published: true,
})

// Create content
const content = await client.contents.create('space-id')

// Get content
const content = await client.contents.get('space-id', 'content-id')

// Update content
await client.contents.update('space-id', 'content-id')

// Delete content
await client.contents.delete('space-id', 'content-id')

// Publish content
await client.contents.publish('space-id', 'content-id')

// Unpublish content
await client.contents.unpublish('space-id', 'content-id')

// Get a specific version
const version = await client.contents.getVersion('space-id', 'content-id', 1)

// Update a version
await client.contents.updateVersion('space-id', 'content-id', 1)

// Publish a specific version
await client.contents.publishVersion('space-id', 'content-id', 1)

// Set a version as current
await client.contents.setVersionAsCurrent('space-id', 'content-id', 1)
```

### Assets

Manage media assets.

```typescript
// List assets
const assets = await client.assets.list('space-id')

// Create an asset
const asset = await client.assets.create('space-id')

// Get an asset
const asset = await client.assets.get('space-id', 'asset-id')

// Update an asset
await client.assets.update('space-id', 'asset-id')

// Delete an asset
await client.assets.delete('space-id', 'asset-id')
```

### Asset Folders

Organize assets in folders.

```typescript
// List asset folders
const folders = await client.assetFolders.list('space-id')

// Create a folder
const folder = await client.assetFolders.create('space-id')

// Get a folder
const folder = await client.assetFolders.get('space-id', 'folder-id')

// Update a folder
await client.assetFolders.update('space-id', 'folder-id')

// Delete a folder
await client.assetFolders.delete('space-id', 'folder-id')
```

### Asset Tags

Tag and organize assets.

```typescript
// List asset tags
const tags = await client.assetTags.list('space-id')

// Create a tag
const tag = await client.assetTags.create('space-id')

// Get a tag
const tag = await client.assetTags.get('space-id', 'tag-id')

// Update a tag
await client.assetTags.update('space-id', 'tag-id')

// Delete a tag
await client.assetTags.delete('space-id', 'tag-id')
```

### Redirects

Manage URL redirects.

```typescript
// List redirects
const redirects = await client.redirects.list('space-id', {
  type: 'permanent',
  sort: '-hits',
})

// Create a redirect
const redirect = await client.redirects.create('space-id')

// Get a redirect
const redirect = await client.redirects.get('space-id', 'redirect-id')

// Update a redirect
await client.redirects.update('space-id', 'redirect-id')

// Delete a redirect
await client.redirects.delete('space-id', 'redirect-id')

// Reset redirect hit counter
await client.redirects.reset('space-id', 'redirect-id')
```

### Tokens

Manage space access tokens.

```typescript
// Create a token
const token = await client.tokens.create('space-id', {
  name: 'Production API Token',
  expires_at: '2024-12-31T23:59:59Z',
  execution_limit: 10000,
})

// Delete a token
await client.tokens.delete('space-id', 'token-id')
```

### Data Sources

Manage external data sources.

```typescript
// List data sources
const sources = await client.dataSources.list('space-id')

// Create a data source
const source = await client.dataSources.create('space-id')

// Get a data source
const source = await client.dataSources.get('space-id', 'source-id')

// Update a data source
await client.dataSources.update('space-id', 'source-id')

// Delete a data source
await client.dataSources.delete('space-id', 'source-id')

// Manage data entries
const entries = await client.dataSources.listEntries('space-id', 'source-id')
const entry = await client.dataSources.createEntry('space-id', 'source-id')
const entry = await client.dataSources.getEntry('space-id', 'source-id', 'entry-id')
await client.dataSources.updateEntry('space-id', 'source-id', 'entry-id')
await client.dataSources.deleteEntry('space-id', 'source-id', 'entry-id')
```

### AI

Access AI-powered features.

```typescript
// Get available AI models
const models = await client.ai.getAvailableModels({
  provider: 'openai',
  capability: 'text-generation',
})

// Generate meta tags
const metaTags = await client.ai.generateMetaTags()

// Translate content
const translation = await client.ai.translate()
```

### System

System health and configuration.

```typescript
// Check API health
const health = await client.system.health()

// Get system configuration
const config = await client.system.getConfig()
```

## Error Handling

The client throws `ManagementApiError` for API errors:

```typescript
import { ManagementApiError } from '@b10cks/mgmt-client'

try {
  const user = await client.users.getMe()
} catch (error) {
  if (error instanceof ManagementApiError) {
    console.error('API Error:', error.message)
    console.error('Status Code:', error.statusCode)
    console.error('Response:', error.response)
  }
}
```

## Pagination

List endpoints return paginated responses:

```typescript
const result = await client.blocks.list('space-id', {
  page: 1,
  per_page: 20,
})

console.log(result.data)        // Array of items
console.log(result.meta.total)  // Total number of items
console.log(result.links.next)  // URL for next page
```

## TypeScript Support

This package is written in TypeScript and includes full type definitions:

```typescript
import type { 
  User, 
  Space, 
  Block, 
  Content,
  PaginatedResponse 
} from '@b10cks/mgmt-client'
```

## License

MIT

## Support

For issues and questions, please visit the [GitHub repository](https://github.com/b10cks/sdk).
