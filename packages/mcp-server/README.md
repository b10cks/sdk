# @b10cks/mcp-server

Model Context Protocol (MCP) server for the [b10cks](https://b10cks.com) headless CMS Management API. Gives AI assistants (Claude, Cursor, Windsurf, etc.) full access to your b10cks workspace — block definitions, content, redirects, data sources, releases, automations, and more.

## Table of contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Authentication](#authentication)
- [Connecting to an MCP client](#connecting-to-an-mcp-client)
  - [Claude Desktop](#claude-desktop)
  - [Cursor](#cursor)
  - [Windsurf](#windsurf)
  - [Programmatic use](#programmatic-use)
- [Usage](#usage)
  - [Discovering operations](#discovering-operations)
  - [Calling an operation](#calling-an-operation)
  - [Common arguments](#common-arguments)
  - [Worked examples](#worked-examples)
- [Operations reference](#operations-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js ≥ 20
- A b10cks account with a Management API token — create one under **Space → Settings → API Tokens**

---

## Installation

Install globally so the `b10cks-mcp-server` binary is on your PATH:

```sh
npm install -g @b10cks/mcp-server
# or
pnpm add -g @b10cks/mcp-server
```

Or use it without installing via `npx`:

```sh
npx -y @b10cks/mcp-server --base-url https://api.b10cks.com --token <your-token>
```

---

## Authentication

The server needs two values:

| Value        | Description                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| **Base URL** | Root URL of your b10cks Management API, e.g. `https://api.b10cks.com`         |
| **Token**    | A Management API token. Generate one under **Space → Settings → API Tokens**. |

CLI flags take precedence over environment variables when both are set.

### Option A — CLI flags (recommended for MCP configs)

```sh
b10cks-mcp-server --base-url https://api.b10cks.com --token pat_xxxxxxxxxxxx
```

Both `--key value` and `--key=value` forms work. An optional timeout (milliseconds, default `30000`) can be set the same way:

```sh
b10cks-mcp-server --base-url https://api.b10cks.com --token pat_xxx --timeout 60000
```

### Option B — Environment variables

```sh
export B10CKS_MGMT_BASE_URL=https://api.b10cks.com
export B10CKS_MGMT_TOKEN=pat_xxxxxxxxxxxx
export B10CKS_MGMT_TIMEOUT=30000   # optional

b10cks-mcp-server
```

The server performs a health check against the Management API on startup. If the token is invalid or the API is unreachable it exits immediately with a clear error message rather than silently failing on the first tool call.

---

## Connecting to an MCP client

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "b10cks": {
      "command": "b10cks-mcp-server",
      "args": ["--base-url", "https://api.b10cks.com", "--token", "pat_xxxxxxxxxxxx"]
    }
  }
}
```

Prefer env vars? Use the `env` key instead:

```json
{
  "mcpServers": {
    "b10cks": {
      "command": "b10cks-mcp-server",
      "env": {
        "B10CKS_MGMT_BASE_URL": "https://api.b10cks.com",
        "B10CKS_MGMT_TOKEN": "pat_xxxxxxxxxxxx"
      }
    }
  }
}
```

Restart Claude Desktop after editing the config.

### Cursor

Add to `.cursor/mcp.json` in your project root (or the global user MCP config):

```json
{
  "mcpServers": {
    "b10cks": {
      "command": "b10cks-mcp-server",
      "args": ["--base-url", "https://api.b10cks.com", "--token", "pat_xxxxxxxxxxxx"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "b10cks": {
      "command": "b10cks-mcp-server",
      "args": ["--base-url", "https://api.b10cks.com", "--token", "pat_xxxxxxxxxxxx"]
    }
  }
}
```

### Programmatic use

The package also exports the building blocks if you need to mount the server on a different transport (e.g. SSE for a web-based AI app):

```ts
import { createServer, createManagementClient } from '@b10cks/mcp-server'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'

const client = createManagementClient({
  baseUrl: 'https://api.b10cks.com',
  token: process.env.B10CKS_MGMT_TOKEN!,
})

const server = createServer(client)
const transport = new SSEServerTransport('/messages', response)
await server.connect(transport)
```

---

## Usage

The server exposes two MCP tools:

| Tool                     | Purpose                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| `b10cks_mgmt_operations` | List all available operations with their descriptions and required arguments |
| `b10cks_mgmt_call`       | Execute any Management API operation                                         |

### Discovering operations

Ask the AI to call `b10cks_mgmt_operations`. The response lists every operation name, description, required arguments, and accepted optional arguments — useful when you're not sure what's available.

### Calling an operation

Operations follow a `resource.method` naming convention and are all invoked through `b10cks_mgmt_call`.

```jsonc
// minimal example
{
  "operation": "contents.list",
  "spaceId": "<your-space-id>",
  "params": { "per_page": 25 },
}
```

### Common arguments

| Argument       | Type   | Description                                                       |
| -------------- | ------ | ----------------------------------------------------------------- |
| `operation`    | string | Operation name, e.g. `contents.list`                              |
| `spaceId`      | string | Space ID — required by almost every space-scoped operation        |
| `id`           | string | Generic resource ID (fallback when a specific ID field isn't set) |
| `contentId`    | string | Content entry ID                                                  |
| `blockId`      | string | Block definition ID                                               |
| `dataSourceId` | string | Data source ID                                                    |
| `entryId`      | string | Data source entry ID                                              |
| `redirectId`   | string | Redirect ID                                                       |
| `versionId`    | string | Version ID                                                        |
| `releaseId`    | string | Release ID                                                        |
| `automationId` | string | Automation ID                                                     |
| `actionId`     | string | Automation action ID                                              |
| `executionId`  | string | Automation execution ID                                           |
| `commentId`    | string | Comment ID                                                        |
| `templateId`   | string | Block template ID                                                 |
| `configId`     | string | AI config ID                                                      |
| `backupId`     | string | Backup ID                                                         |
| `inviteId`     | string | Space invite ID                                                   |
| `noteId`       | string | Provider note ID                                                  |
| `params`       | object | Query parameters (filters, pagination, sorting)                   |
| `payload`      | object | Request body for create / update / action calls                   |

---

### Worked examples

**Find your space ID**

```jsonc
{ "operation": "spaces.list" }
```

**Get the site structure tree**

```jsonc
{ "operation": "spaces.contentMenu", "spaceId": "<space-id>" }
```

---

#### Block definitions

**List all block definitions**

```jsonc
{ "operation": "blocks.list", "spaceId": "<space-id>" }
```

**Create a block definition**

```jsonc
{
  "operation": "blocks.create",
  "spaceId": "<space-id>",
  "payload": {
    "name": "Hero",
    "component": "hero",
    "schema": {
      "headline": { "type": "text" },
      "subline": { "type": "textarea" },
      "image": { "type": "asset" },
      "cta": { "type": "link" },
    },
  },
}
```

**Add a field to an existing block**

```jsonc
{
  "operation": "blocks.update",
  "spaceId": "<space-id>",
  "blockId": "<block-id>",
  "payload": {
    "schema": {
      "headline": { "type": "text" },
      "subline": { "type": "textarea" },
      "image": { "type": "asset" },
      "cta": { "type": "link" },
      "theme": { "type": "option", "options": ["light", "dark"] },
    },
  },
}
```

**Restore a previous block version**

```jsonc
{
  "operation": "blocks.restoreVersion",
  "spaceId": "<space-id>",
  "blockId": "<block-id>",
  "versionId": "<version-id>",
}
```

---

#### Content management

**Create a content entry**

```jsonc
{
  "operation": "contents.create",
  "spaceId": "<space-id>",
  "payload": {
    "name": "Home",
    "slug": "/",
    "component": "page",
    "content": {
      "body": [{ "component": "hero", "headline": "Welcome" }],
    },
  },
}
```

**Bulk-create a site structure**

```jsonc
{
  "operation": "contents.bulkCreate",
  "spaceId": "<space-id>",
  "payload": {
    "items": [
      { "name": "Blog", "slug": "/blog", "component": "folder" },
      { "name": "Post 1", "slug": "/blog/post-1", "component": "blog_post" },
    ],
  },
}
```

**Reorder content in the tree**

```jsonc
{
  "operation": "contents.treeOperations",
  "spaceId": "<space-id>",
  "payload": {
    "operations": [
      { "action": "move", "id": "<content-id>", "parent_id": "<parent-id>", "position": 0 },
    ],
  },
}
```

**Publish a content entry**

```jsonc
{ "operation": "contents.publish", "spaceId": "<space-id>", "contentId": "<content-id>" }
```

**Schedule a future publish**

```jsonc
{
  "operation": "contents.schedule",
  "spaceId": "<space-id>",
  "contentId": "<content-id>",
  "payload": { "publish_at": "2026-09-01T08:00:00Z" },
}
```

---

#### Redirects

**Create a redirect**

```jsonc
{
  "operation": "redirects.create",
  "spaceId": "<space-id>",
  "payload": { "from": "/old-path", "to": "/new-path", "type": 301 },
}
```

**Bulk-import redirects**

```jsonc
{
  "operation": "redirects.importData",
  "spaceId": "<space-id>",
  "payload": {
    "redirects": [
      { "from": "/old-a", "to": "/new-a", "type": 301 },
      { "from": "/old-b", "to": "/new-b", "type": 302 },
    ],
  },
}
```

**Export all redirects**

```jsonc
{ "operation": "redirects.exportData", "spaceId": "<space-id>" }
```

---

#### Data sources & translations

**List data sources**

```jsonc
{ "operation": "dataSources.list", "spaceId": "<space-id>" }
```

**Add a translation key**

```jsonc
{
  "operation": "dataSources.entries.create",
  "spaceId": "<space-id>",
  "dataSourceId": "<data-source-id>",
  "payload": {
    "name": "cta_label",
    "value": { "en": "Learn more", "de": "Mehr erfahren", "fr": "En savoir plus" },
  },
}
```

**AI-translate missing locale dimensions**

```jsonc
{
  "operation": "dataSources.translateMissingDimensions",
  "spaceId": "<space-id>",
  "dataSourceId": "<data-source-id>",
  "payload": { "target_locales": ["fr", "es"] },
}
```

---

#### Releases

**Create a release, assign a content version, then publish**

```jsonc
// 1. Create the release
{ "operation": "releases.create", "spaceId": "<space-id>", "payload": { "name": "Q3 Launch" } }

// 2. Assign a content version to it
{
  "operation": "releases.assignVersion",
  "spaceId": "<space-id>",
  "releaseId": "<release-id>",
  "payload": { "content_id": "<content-id>", "version_id": "<version-id>" }
}

// 3. Publish the entire release
{ "operation": "releases.publish", "spaceId": "<space-id>", "releaseId": "<release-id>" }
```

---

#### Automations

**Browse available triggers**

```jsonc
{ "operation": "automations.getTriggerCatalog", "spaceId": "<space-id>" }
```

**Create an automation**

```jsonc
{
  "operation": "automations.create",
  "spaceId": "<space-id>",
  "payload": {
    "name": "Notify on publish",
    "trigger": { "type": "content.published" },
    "actions": [{ "type": "webhook", "url": "https://hooks.example.com/notify" }],
  },
}
```

**Manually trigger an automation**

```jsonc
{
  "operation": "automations.trigger",
  "spaceId": "<space-id>",
  "automationId": "<automation-id>",
}
```

---

## Operations reference

177 operations across 19 resource groups.

### system

| Operation       | Description                              |
| --------------- | ---------------------------------------- |
| `system.health` | Check Management API health              |
| `system.config` | Read public Management API configuration |

### users

| Operation        | Description                           |
| ---------------- | ------------------------------------- |
| `users.me`       | Read the authenticated user           |
| `users.updateMe` | Update the authenticated user profile |

### teams

| Operation          | Description               |
| ------------------ | ------------------------- |
| `teams.list`       | List teams                |
| `teams.create`     | Create a team             |
| `teams.get`        | Get a team by ID          |
| `teams.update`     | Update a team             |
| `teams.delete`     | Delete a team             |
| `teams.hierarchy`  | Read team hierarchy       |
| `teams.addUser`    | Add a user to a team      |
| `teams.removeUser` | Remove a user from a team |

### spaces

| Operation                       | Description                                |
| ------------------------------- | ------------------------------------------ |
| `spaces.list`                   | List spaces                                |
| `spaces.create`                 | Create a space                             |
| `spaces.get`                    | Get a space by ID                          |
| `spaces.update`                 | Update a space                             |
| `spaces.delete`                 | Delete a space                             |
| `spaces.updateIcon`             | Update a space icon                        |
| `spaces.archive`                | Archive a space                            |
| `spaces.stats`                  | Read stats for a space                     |
| `spaces.aiUsage`                | Read AI usage for a space                  |
| `spaces.contentMenu`            | Get the content menu (site structure tree) |
| `spaces.listMembers`            | List members                               |
| `spaces.updateMember`           | Update a member role                       |
| `spaces.removeMember`           | Remove a member                            |
| `spaces.listInvites`            | List pending invites                       |
| `spaces.createInvite`           | Invite a user                              |
| `spaces.deleteInvite`           | Delete a pending invite                    |
| `spaces.resendInvite`           | Resend an invite email                     |
| `spaces.updateSearch`           | Update search configuration                |
| `spaces.reindexSearch`          | Trigger a full search reindex              |
| `spaces.listSubscriptions`      | List available subscription plans          |
| `spaces.getCurrentSubscription` | Get the current active subscription        |
| `spaces.checkoutSubscription`   | Create a checkout session to change plan   |
| `spaces.reinitSubscription`     | Reinitialize a subscription checkout       |
| `spaces.cancelSubscription`     | Cancel the active subscription             |
| `spaces.getAiSettings`          | Get AI settings                            |
| `spaces.updateAiSettings`       | Update AI settings                         |
| `spaces.listAiConfigs`          | List AI configurations                     |
| `spaces.createAiConfig`         | Create an AI configuration                 |
| `spaces.getAiConfig`            | Get an AI configuration by ID              |
| `spaces.updateAiConfig`         | Update an AI configuration                 |
| `spaces.deleteAiConfig`         | Delete an AI configuration                 |
| `spaces.getAuditLogs`           | Get audit logs                             |
| `spaces.listBackups`            | List backups                               |
| `spaces.createBackup`           | Create a backup                            |
| `spaces.getBackup`              | Get a backup by ID                         |
| `spaces.updateBackup`           | Update a backup                            |
| `spaces.deleteBackup`           | Delete a backup                            |
| `spaces.listMigrations`         | List migrations                            |
| `spaces.createMigration`        | Create a migration                         |

### blocks

| Operation                                    | Description                         |
| -------------------------------------------- | ----------------------------------- |
| `blocks.list`                                | List block definitions              |
| `blocks.create`                              | Create a block definition           |
| `blocks.get`                                 | Get a block definition by ID        |
| `blocks.update`                              | Update a block definition           |
| `blocks.delete`                              | Delete a block definition           |
| `blocks.listTemplates`                       | List templates for a block          |
| `blocks.createTemplate`                      | Create a block template             |
| `blocks.getTemplate`                         | Get a block template by ID          |
| `blocks.updateTemplate`                      | Update a block template             |
| `blocks.deleteTemplate`                      | Delete a block template             |
| `blocks.listVersions`                        | List versions of a block definition |
| `blocks.getVersion`                          | Get a specific block version        |
| `blocks.updateVersion`                       | Update a block version              |
| `blocks.deleteVersion`                       | Delete a block version              |
| `blocks.restoreVersion`                      | Restore a block version as current  |
| `blockFolders.list/create/get/update/delete` | Manage block folders                |
| `blockTags.list/create/get/update/delete`    | Manage block tags                   |

### contents

| Operation                      | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `contents.list`                | List content entries                           |
| `contents.create`              | Create a content entry                         |
| `contents.get`                 | Get a content entry by ID                      |
| `contents.update`              | Update a content entry                         |
| `contents.delete`              | Delete a content entry                         |
| `contents.bulkCreate`          | Bulk-create multiple content entries           |
| `contents.treeOperations`      | Batch tree operations (move, reorder, nest)    |
| `contents.move`                | Move a content entry                           |
| `contents.publish`             | Publish a content entry                        |
| `contents.unpublish`           | Unpublish a content entry                      |
| `contents.schedule`            | Schedule a content entry for publish/unpublish |
| `contents.listVersions`        | List versions of a content entry               |
| `contents.getVersion`          | Get a specific content version                 |
| `contents.updateVersion`       | Update a content version label/message         |
| `contents.publishVersion`      | Publish a specific content version             |
| `contents.setVersionAsCurrent` | Set a content version as the current draft     |

### comments

| Operation                 | Description                      |
| ------------------------- | -------------------------------- |
| `comments.list`           | List comments on a content entry |
| `comments.create`         | Add a comment                    |
| `comments.get`            | Get a comment by ID              |
| `comments.update`         | Update a comment                 |
| `comments.delete`         | Delete a comment                 |
| `comments.resolve`        | Mark a comment as resolved       |
| `comments.unresolve`      | Mark a comment as unresolved     |
| `comments.listReactions`  | List reactions on a comment      |
| `comments.addReaction`    | Add a reaction                   |
| `comments.removeReaction` | Remove a reaction                |

### redirects

| Operation              | Description                    |
| ---------------------- | ------------------------------ |
| `redirects.list`       | List redirects                 |
| `redirects.create`     | Create a redirect              |
| `redirects.get`        | Get a redirect by ID           |
| `redirects.update`     | Update a redirect              |
| `redirects.delete`     | Delete a redirect              |
| `redirects.reset`      | Reset redirect hit counters    |
| `redirects.exportData` | Export redirects as CSV/JSON   |
| `redirects.importData` | Import redirects from CSV/JSON |

### dataSources

| Operation                                | Description                            |
| ---------------------------------------- | -------------------------------------- |
| `dataSources.list`                       | List data sources                      |
| `dataSources.create`                     | Create a data source                   |
| `dataSources.get`                        | Get a data source by ID                |
| `dataSources.update`                     | Update a data source                   |
| `dataSources.delete`                     | Delete a data source                   |
| `dataSources.entries.list`               | List entries in a data source          |
| `dataSources.entries.create`             | Create a data source entry             |
| `dataSources.entries.get`                | Get a data source entry                |
| `dataSources.entries.update`             | Update a data source entry             |
| `dataSources.entries.delete`             | Delete a data source entry             |
| `dataSources.exportEntries`              | Export data source entries             |
| `dataSources.importEntries`              | Import entries into a data source      |
| `dataSources.translateMissingDimensions` | AI-translate missing locale dimensions |

### automations

| Operation                       | Description                         |
| ------------------------------- | ----------------------------------- |
| `automations.list`              | List automations                    |
| `automations.create`            | Create an automation                |
| `automations.get`               | Get an automation by ID             |
| `automations.update`            | Update an automation                |
| `automations.delete`            | Delete an automation                |
| `automations.trigger`           | Manually trigger an automation      |
| `automations.getTriggerCatalog` | Get available automation triggers   |
| `automations.listActions`       | List automation actions             |
| `automations.createAction`      | Create an automation action         |
| `automations.getAction`         | Get an automation action by ID      |
| `automations.updateAction`      | Update an automation action         |
| `automations.deleteAction`      | Delete an automation action         |
| `automations.statsExecutions`   | Execution count stats               |
| `automations.statsTrends`       | Trend stats                         |
| `automations.statsStatistics`   | Detailed statistics                 |
| `automations.statsSummary`      | Statistics summary                  |
| `automations.listExecutions`    | List execution history              |
| `automations.replayExecution`   | Replay a failed/completed execution |

### releases

| Operation                | Description                                  |
| ------------------------ | -------------------------------------------- |
| `releases.list`          | List releases                                |
| `releases.create`        | Create a release                             |
| `releases.get`           | Get a release by ID                          |
| `releases.update`        | Update a release                             |
| `releases.delete`        | Delete a release                             |
| `releases.commit`        | Commit a release (finalize content snapshot) |
| `releases.cancel`        | Cancel a release                             |
| `releases.publish`       | Publish all versions in a release            |
| `releases.assignVersion` | Assign a content version to a release        |
| `releases.removeVersion` | Remove a content version from a release      |

### assets

| Operation                                    | Description          |
| -------------------------------------------- | -------------------- |
| `assets.list`                                | List assets          |
| `assets.create`                              | Create an asset      |
| `assets.get`                                 | Get an asset by ID   |
| `assets.update`                              | Update an asset      |
| `assets.delete`                              | Delete an asset      |
| `assetFolders.list/create/get/update/delete` | Manage asset folders |
| `assetTags.list/create/get/update/delete`    | Manage asset tags    |

### tokens

| Operation       | Description              |
| --------------- | ------------------------ |
| `tokens.create` | Create a space API token |
| `tokens.delete` | Delete a space API token |

### ai

| Operation            | Description                       |
| -------------------- | --------------------------------- |
| `ai.availableModels` | List available AI models          |
| `ai.metaTags`        | Generate AI meta tags for content |
| `ai.translate`       | Translate content with AI         |

### provider

| Operation             | Description                   |
| --------------------- | ----------------------------- |
| `provider.getStats`   | Get provider-level statistics |
| `provider.listNotes`  | List provider notes           |
| `provider.createNote` | Create a provider note        |
| `provider.getNote`    | Get a provider note by ID     |
| `provider.updateNote` | Update a provider note        |
| `provider.deleteNote` | Delete a provider note        |

---

## Troubleshooting

**Server exits immediately on startup**

The server validates credentials before accepting connections. Check that `--base-url` / `B10CKS_MGMT_BASE_URL` points to the correct API root and that `--token` / `B10CKS_MGMT_TOKEN` is a Management API token (not a public CDN token).

**`Missing Management API base URL`**

Neither the `--base-url` flag nor the `B10CKS_MGMT_BASE_URL` env var was provided.

**`Missing Management API token`**

Neither the `--token` flag nor the `B10CKS_MGMT_TOKEN` env var was provided.

**`Missing required string argument: spaceId`**

Most operations are space-scoped. Call `spaces.list` first to get your space ID.

**Operation returns a 403**

The token lacks permission for that operation. Review its scopes under **Space → Settings → API Tokens**.

**`npx` picks up a stale cached version**

Run `npx --yes @b10cks/mcp-server@latest` to force the latest version.

---

## License

MIT
