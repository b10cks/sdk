# @b10cks/mgmt-client

TypeScript client for the b10cks Management API. [b10cks](https://www.b10cks.com) is an open-source headless CMS with a composable block-based content model, available as SaaS or self-hosted.

## Installation

```bash
npm install @b10cks/mgmt-client
# or
pnpm add @b10cks/mgmt-client
# or
yarn add @b10cks/mgmt-client
```

## Quick Start

```typescript
import { ManagementClient } from '@b10cks/mgmt-client'

const client = new ManagementClient({
  baseUrl: 'https://api.b10cks.com',
  token: 'your-bearer-token',
})

const { data: user } = await client.users.getMe()
const spaces = await client.spaces.list()
const blocks = await client.blocks.list('space-id', { search: 'article' })
```

## Configuration

```typescript
interface ClientConfig {
  baseUrl: string // Base URL of the b10cks API
  token: string // Bearer token for authentication
  timeout?: number // Request timeout in ms (default: 30 000)
  headers?: Record<string, string> // Extra headers sent on every request
}
```

## Resources

| Resource      | Property              | Description                                                      |
| ------------- | --------------------- | ---------------------------------------------------------------- |
| Users         | `client.users`        | Current user profile, settings, tokens, invites, social links    |
| Teams         | `client.teams`        | Teams, members, invites, SAML, blueprints, space roles           |
| Spaces        | `client.spaces`       | Spaces, members, invites, subscriptions, AI, backups, migrations |
| Blocks        | `client.blocks`       | Block schemas, templates, versions                               |
| Block Tags    | `client.blockTags`    | Tags for organizing blocks                                       |
| Block Folders | `client.blockFolders` | Folder hierarchy for blocks                                      |
| Contents      | `client.contents`     | Content entries, tree operations, versions, publishing           |
| Comments      | `client.comments`     | Comments, replies, reactions on content                          |
| Assets        | `client.assets`       | Media assets with file upload support                            |
| Asset Folders | `client.assetFolders` | Folder hierarchy for assets                                      |
| Asset Tags    | `client.assetTags`    | Tags for organizing assets                                       |
| Redirects     | `client.redirects`    | URL redirects with hit tracking                                  |
| Tokens        | `client.tokens`       | Space-scoped API tokens                                          |
| Data Sources  | `client.dataSources`  | External data sources and entries                                |
| Automations   | `client.automations`  | Automation actions, triggers, executions, stats                  |
| Releases      | `client.releases`     | Release management and publishing workflows                      |
| AI            | `client.ai`           | AI models, translation, meta-tag generation, streaming           |
| System        | `client.system`       | Health, config, plans                                            |
| Provider      | `client.provider`     | Provider-level stats and notes                                   |

## API Reference

### Users

```typescript
const { data: me } = await client.users.getMe()
await client.users.updateMe({ firstname: 'Jane', lastname: 'Doe' })
await client.users.updateSettings({ theme: 'dark' })
await client.users.updateAvatar({ avatar: 'base64...' })
await client.users.updatePassword({ old_password: '...', password: '...' })

// Social links
const { data: links } = await client.users.listSocialLinks()
await client.users.deleteSocialLink('github')

// Personal access tokens
const tokens = await client.users.listTokens()
const { data: token } = await client.users.createToken({ name: 'CI Token' })
await client.users.deleteToken('token-id')

// Invites
const invites = await client.users.listInvites()
const { data: invite } = await client.users.getInvite('invite-id')
await client.users.acceptInvite('invite-id')
```

### Teams

```typescript
const teams = await client.teams.list()
const team = await client.teams.create({ name: 'Marketing', color: '#FF5733' })
await client.teams.update('team-id', { name: 'Marketing & Growth' })
await client.teams.delete('team-id')
const hierarchy = await client.teams.getHierarchy()

// Members
const members = await client.teams.listMembers('team-id')
await client.teams.updateMember('team-id', 'user-id', { role: 'admin' })
await client.teams.removeMember('team-id', 'user-id')

// Invites
const invites = await client.teams.listInvites('team-id')
await client.teams.createInvite('team-id', { email: 'user@example.com', role: 'member' })
await client.teams.deleteInvite('team-id', 'invite-id')
await client.teams.resendInvite('team-id', 'invite-id')

// SAML provider
const { data: saml } = await client.teams.getSamlProvider('team-id')
await client.teams.upsertSamlProvider('team-id', { enabled: true, sso_url: '...', idp_entity_id: '...' })
await client.teams.deleteSamlProvider('team-id')

// Space blueprints
const blueprints = await client.teams.listBlueprints('team-id')
await client.teams.createBlueprint('team-id', { name: 'Blog', data: { ... } })
await client.teams.updateBlueprint('team-id', 'blueprint-id', { name: 'Blog v2' })
await client.teams.deleteBlueprint('team-id', 'blueprint-id')

// Space roles
const roles = await client.teams.listSpaceRoles('team-id')
await client.teams.createSpaceRole('team-id', { key: 'editor', name: 'Editor', abilities: ['content.create'] })
await client.teams.updateSpaceRole('team-id', 'role-id', { name: 'Senior Editor' })
await client.teams.deleteSpaceRole('team-id', 'role-id')
```

### Spaces

```typescript
const spaces = await client.spaces.list()
const space = await client.spaces.create({ name: 'My Space', slug: 'my-space' })
await client.spaces.update('space-id', { name: 'Updated', slug: 'updated' })
await client.spaces.delete('space-id')
await client.spaces.archive('space-id')
await client.spaces.updateIcon('space-id', { icon: 'base64...' })
const stats = await client.spaces.getStats('space-id')
const menu = await client.spaces.getContentMenu('space-id')

// Members
const members = await client.spaces.listMembers('space-id')
await client.spaces.updateMember('space-id', 'user-id', { role: 'editor' })
await client.spaces.removeMember('space-id', 'user-id')

// Invites
await client.spaces.createInvite('space-id', { email: 'user@example.com', role: 'viewer' })
await client.spaces.resendInvite('space-id', 'invite-id')
await client.spaces.deleteInvite('space-id', 'invite-id')

// Search
await client.spaces.updateSearch('space-id', { driver: 'meilisearch', ... })
await client.spaces.reindexSearch('space-id')

// Subscriptions
const { data: current } = await client.spaces.getCurrentSubscription('space-id')
const { checkout_url } = await client.spaces.checkoutSubscription('space-id', { plan_id: 'pro' })
await client.spaces.cancelSubscription('space-id')

// AI settings & configs
const { data: aiSettings } = await client.spaces.getAiSettings('space-id')
await client.spaces.updateAiSettings('space-id', { model: 'gpt-4o', enabled: true })
const { data: aiConfigs } = await client.spaces.listAiConfigs('space-id')
await client.spaces.createAiConfig('space-id', { name: 'Blog Writer', driver: 'openai', model: 'gpt-4o' })

// Audit logs
const logs = await client.spaces.getAuditLogs('space-id', { page: 1 })

// Backups
const backups = await client.spaces.listBackups('space-id')
await client.spaces.createBackup('space-id', { name: 'Weekly backup' })

// Migrations
const migrations = await client.spaces.listMigrations('space-id')
await client.spaces.createMigration('space-id', { source_space_id: 'other-space-id' })

// Presence (real-time collaboration)
await client.spaces.updateSpacePresence('space-id')
await client.spaces.leaveSpacePresence('space-id')
await client.spaces.updateContentPresence('space-id', 'content-id')
await client.spaces.leaveContentPresence('space-id', 'content-id')
```

### Blocks

```typescript
const blocks = await client.blocks.list('space-id', {
  search: 'blog',
  type: 'article',
  sort: '-created_at',
  per_page: 25,
})
const block = await client.blocks.create('space-id', { name: 'Article', slug: 'article', schema: { ... } })
await client.blocks.update('space-id', 'block-id', { name: 'Updated Article' })
await client.blocks.delete('space-id', 'block-id')

// Templates
const templates = await client.blocks.listTemplates('space-id', 'block-id')
await client.blocks.createTemplate('space-id', 'block-id', { name: 'Featured Article', content: { ... } })
await client.blocks.deleteTemplate('space-id', 'block-id', 'template-id')

// Versions
const versions = await client.blocks.listVersions('space-id', 'block-id')
await client.blocks.restoreVersion('space-id', 'block-id', 'version-id')
```

### Contents

```typescript
const contents = await client.contents.list('space-id', {
  block_id: 'article-block-id',
  published: true,
  per_page: 20,
})

// Create content with translations in one pass
const content = await client.contents.create('space-id', {
  name: 'Home',
  slug: 'home',
  block_id: 'page-block-id',
  language_iso: 'en',
  content: { title: 'Home', hero: '...' },
  translations: [
    {
      name: 'Startseite',
      slug: 'startseite',
      language_iso: 'de',
      content: { title: 'Startseite' },
    },
  ],
})

await client.contents.update('space-id', 'content-id', { name: 'Homepage', message: 'SEO update' })
await client.contents.delete('space-id', 'content-id')

// Publishing
await client.contents.publish('space-id', 'content-id')
await client.contents.publish('space-id', 'content-id', { published_at: '2025-01-01T00:00:00Z' })
await client.contents.unpublish('space-id', 'content-id')
await client.contents.schedule('space-id', 'content-id', { scheduled_at: '2025-06-01T08:00:00Z' })

// Tree operations (bulk create/move/delete/duplicate)
await client.contents.treeOperations('space-id', {
  operations: [
    { type: 'create', temp_id: 'tmp-1', block_id: 'page-block-id', name: 'About' },
    { type: 'move', ids: ['content-a', 'content-b'], parent_id: 'content-parent' },
    { type: 'delete', ids: ['content-old'] },
  ],
})

await client.contents.move('space-id', 'content-id', { parent_id: 'new-parent-id', position: 2 })
await client.contents.bulkCreate('space-id', {
  items: [{ name: 'Page 1', slug: 'page-1', block_id: '...' }],
})

// Versions
const versions = await client.contents.listVersions('space-id', 'content-id')
const version = await client.contents.getVersion('space-id', 'content-id', 'version-id')
await client.contents.publishVersion('space-id', 'content-id', 'version-id')
await client.contents.setVersionAsCurrent('space-id', 'content-id', 'version-id')
```

### Comments

```typescript
const comments = await client.comments.list('space-id', 'content-id')
await client.comments.create('space-id', 'content-id', { body: 'Looks great!', field: 'title' })
await client.comments.update('space-id', 'content-id', 'comment-id', { body: 'Updated comment' })
await client.comments.delete('space-id', 'content-id', 'comment-id')
await client.comments.resolve('space-id', 'content-id', 'comment-id')
await client.comments.unresolve('space-id', 'content-id', 'comment-id')

// Reactions
await client.comments.addReaction('space-id', 'content-id', 'comment-id', { emoji: '👍' })
await client.comments.removeReaction('space-id', 'content-id', 'comment-id')
```

### Assets

```typescript
const assets = await client.assets.list('space-id')

// Create (browser — File object)
await client.assets.create('space-id', { file: fileInput.files[0], name: 'hero.jpg' })

// Create (Node.js — Buffer)
import { readFileSync } from 'fs'
const buffer = readFileSync('./hero.jpg')
await client.assets.create('space-id', { file: buffer, filename: 'hero.jpg', mime_type: 'image/jpeg' })

await client.assets.update('space-id', 'asset-id', { name: 'Updated name' })
await client.assets.delete('space-id', 'asset-id')

const { data: contents } = await client.assets.getLinkedContents('space-id', 'asset-id')
await client.assets.exportData('space-id')
await client.assets.importData('space-id', { ... })
```

### Redirects

```typescript
const redirects = await client.redirects.list('space-id', { type: 'permanent', sort: '-hits' })
await client.redirects.create('space-id', { source: '/old-path', destination: '/new-path', type: 'permanent' })
await client.redirects.update('space-id', 'redirect-id', { destination: '/updated-path' })
await client.redirects.delete('space-id', 'redirect-id')
await client.redirects.reset('space-id', 'redirect-id')  // reset hit counter
await client.redirects.exportData('space-id')
await client.redirects.importData('space-id', { ... })
```

### Tokens

```typescript
const tokens = await client.tokens.list('space-id')
const token = await client.tokens.create('space-id', {
  name: 'Production',
  expires_at: '2025-12-31T23:59:59Z',
})
await client.tokens.delete('space-id', 'token-id')
```

### Data Sources

```typescript
const sources = await client.dataSources.list('space-id')
const source = await client.dataSources.create('space-id', { name: 'Products', slug: 'products', type: 'json', schema: { ... } })

// Entries
const entries = await client.dataSources.listEntries('space-id', 'source-id')
await client.dataSources.createEntry('space-id', 'source-id', { data: { name: 'Widget', price: 9.99 } })
await client.dataSources.updateEntry('space-id', 'source-id', 'entry-id', { data: { price: 12.99 } })
await client.dataSources.deleteEntry('space-id', 'source-id', 'entry-id')

// Import / export
await client.dataSources.exportEntries('space-id', 'source-id')
await client.dataSources.importEntries('space-id', 'source-id', { ... })
await client.dataSources.translateMissingDimensions('space-id', 'source-id')
```

### Automations

```typescript
// Actions (the "what to do")
const actions = await client.automations.listActions('space-id')
await client.automations.createAction('space-id', {
  name: 'Slack Notify',
  type: 'webhook',
  config: { url: 'https://hooks.slack.com/...' },
})

// Trigger catalog
const catalog = await client.automations.getTriggerCatalog('space-id')

// Automations (the "when + what")
const automations = await client.automations.list('space-id')
await client.automations.create('space-id', {
  name: 'Notify on publish',
  action_id: 'action-id',
  trigger_type: 'content.published',
})
await client.automations.trigger('space-id', 'automation-id')

// Executions
const executions = await client.automations.listExecutions('space-id', {
  automation_id: 'automation-id',
})
await client.automations.replayExecution('space-id', 'execution-id')

// Stats
const summary = await client.automations.getStatsSummary('space-id', 'automation-id')
const trends = await client.automations.getStatsTrends('space-id', 'automation-id', {
  interval: 'day',
})
```

### Releases

```typescript
const releases = await client.releases.list('space-id')
const { data: release } = await client.releases.create('space-id', {
  name: 'Q1 Launch',
  description: 'Homepage refresh and blog posts',
})

// Add / remove content versions from the release
await client.releases.assignVersion('space-id', 'release-id', { version_id: 'version-id' })
await client.releases.removeVersion('space-id', 'release-id', { version_id: 'version-id' })

// Lifecycle
await client.releases.commit('space-id', 'release-id') // lock for review
await client.releases.publish('space-id', 'release-id') // go live
await client.releases.cancel('space-id', 'release-id') // discard
```

### AI

```typescript
const { data: models } = await client.ai.getModels()
const { data: available } = await client.ai.getAvailableModels({ provider: 'openai' })

const metaTags = await client.ai.generateMetaTags({ content: { title: 'My Article', body: '...' } })
const translation = await client.ai.translate({ text: 'Hello', target_language: 'de' })

// Streaming endpoints return the raw response for client-side SSE consumption
await client.ai.translateStream({ text: 'Hello', target_language: 'fr' })
await client.ai.contentInteractionStream({ content_id: 'content-id', prompt: 'Summarise this' })
```

### System

```typescript
const health = await client.system.health()
const config = await client.system.getConfig()
const { data: plans } = await client.system.getPlans()
```

### Provider

```typescript
const stats = await client.provider.getStats()
const notes = await client.provider.listNotes()
await client.provider.createNote({
  title: 'Maintenance window',
  content: 'Scheduled downtime on Sunday',
  is_pinned: true,
})
await client.provider.updateNote('note-id', { is_pinned: false })
await client.provider.deleteNote('note-id')
```

## Error Handling

```typescript
import { ManagementApiError } from '@b10cks/mgmt-client'

try {
  await client.contents.publish('space-id', 'content-id')
} catch (error) {
  if (error instanceof ManagementApiError) {
    console.error(error.message) // human-readable message
    console.error(error.statusCode) // HTTP status code
    console.error(error.response) // raw API response body
  }
}
```

## Pagination

All list endpoints return a `PaginatedResponse<T>`:

```typescript
const result = await client.blocks.list('space-id', { page: 1, per_page: 25 })

result.data // T[]  — current page items
result.meta.total // total item count across all pages
result.meta.last_page
result.links.next // URL for the next page, or null
result.links.prev // URL for the previous page, or null
```

## TypeScript

All types are exported from the package root:

```typescript
import type {
  Automation,
  AutomationAction,
  AutomationExecution,
  Backup,
  Block,
  BlockTemplate,
  BlockVersion,
  Comment,
  CommentReaction,
  Content,
  ContentVersion,
  ContentVersionListItem,
  DataEntry,
  DataSource,
  Invite,
  Migration,
  PaginatedResponse,
  Plan,
  Release,
  Redirect,
  Space,
  SpaceAiConfig,
  SpaceBlueprint,
  SpaceMember,
  SpaceToken,
  Subscription,
  Team,
  TeamMember,
  TeamSamlProvider,
  User,
  SimpleUser,
} from '@b10cks/mgmt-client'
```

## License

MIT

## Support

For issues and questions, visit the [GitHub repository](https://github.com/b10cks/sdk).
