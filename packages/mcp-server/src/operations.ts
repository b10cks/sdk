import type { ManagementClient } from '@b10cks/mgmt-client'

export interface MgmtToolArguments {
  operation: string
  spaceId?: string
  teamId?: string
  userId?: string
  id?: string
  folderId?: string
  tagId?: string
  contentId?: string
  blockId?: string
  assetId?: string
  redirectId?: string
  tokenId?: string
  dataSourceId?: string
  entryId?: string
  version?: number
  versionId?: string
  automationId?: string
  actionId?: string
  executionId?: string
  releaseId?: string
  commentId?: string
  templateId?: string
  configId?: string
  backupId?: string
  migrationId?: string
  inviteId?: string
  noteId?: string
  iconId?: string
  collectionId?: string
  shareId?: string
  packageId?: string
  notificationId?: string
  periodId?: string
  roleId?: string
  blueprintId?: string
  provider?: string
  token?: string
  accessToken?: string
  params?: Record<string, unknown>
  payload?: Record<string, unknown>
}

type OperationHandler = (client: ManagementClient, args: MgmtToolArguments) => Promise<unknown>

export interface OperationDefinition {
  name: string
  description: string
  required?: string[]
  accepts?: string[]
  handler: OperationHandler
}

const requireString = (args: MgmtToolArguments, key: keyof MgmtToolArguments): string => {
  const value = args[key]

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required string argument: ${String(key)}`)
  }

  return value
}

const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

/**
 * Strips prototype-polluting keys from an untrusted object coming from an MCP
 * tool call. Returns a plain object safe to forward to the API.
 */
const sanitize = (input: Record<string, unknown> | undefined): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  if (!input || typeof input !== 'object') return out
  for (const [key, value] of Object.entries(input)) {
    if (DANGEROUS_KEYS.has(key)) continue
    out[key] = value
  }
  return out
}

const payload = (args: MgmtToolArguments): Record<string, unknown> => sanitize(args.payload)
const params = (args: MgmtToolArguments): Record<string, unknown> | undefined =>
  args.params ? sanitize(args.params) : undefined

/**
 * Wraps untrusted params as query-string options for the few non-paginated
 * endpoints that take filters via `RequestOptions`. Routing through `query`
 * (never the whole options object) prevents a caller-supplied `headers` key
 * from being injected into the request headers. Paginated endpoints take a
 * dedicated `params` argument — use `params()` for those.
 */
const queryOpts = (args: MgmtToolArguments): { query: Record<string, unknown> } => ({
  query: sanitize(args.params),
})

const spaceId = (args: MgmtToolArguments): string => requireString(args, 'spaceId')
const id = (args: MgmtToolArguments): string => requireString(args, 'id')
const contentId = (args: MgmtToolArguments): string => args.contentId ?? id(args)
const blockId = (args: MgmtToolArguments): string => args.blockId ?? id(args)
const assetId = (args: MgmtToolArguments): string => args.assetId ?? id(args)
const folderId = (args: MgmtToolArguments): string => args.folderId ?? id(args)
const tagId = (args: MgmtToolArguments): string => args.tagId ?? id(args)
const redirectId = (args: MgmtToolArguments): string => args.redirectId ?? id(args)
const tokenId = (args: MgmtToolArguments): string => args.tokenId ?? id(args)
const dataSourceId = (args: MgmtToolArguments): string => args.dataSourceId ?? id(args)
const entryId = (args: MgmtToolArguments): string => args.entryId ?? id(args)
const versionId = (args: MgmtToolArguments): string => args.versionId ?? id(args)
const automationId = (args: MgmtToolArguments): string => args.automationId ?? id(args)
const actionId = (args: MgmtToolArguments): string => args.actionId ?? id(args)
const executionId = (args: MgmtToolArguments): string => args.executionId ?? id(args)
const releaseId = (args: MgmtToolArguments): string => args.releaseId ?? id(args)
const commentId = (args: MgmtToolArguments): string => args.commentId ?? id(args)
const templateId = (args: MgmtToolArguments): string => args.templateId ?? id(args)
const configId = (args: MgmtToolArguments): string => args.configId ?? id(args)
const backupId = (args: MgmtToolArguments): string => args.backupId ?? id(args)
const inviteId = (args: MgmtToolArguments): string => args.inviteId ?? id(args)
const noteId = (args: MgmtToolArguments): string => args.noteId ?? id(args)
const iconId = (args: MgmtToolArguments): string => args.iconId ?? id(args)
const teamId = (args: MgmtToolArguments): string => requireString(args, 'teamId')
const userId = (args: MgmtToolArguments): string => requireString(args, 'userId')
const collectionId = (args: MgmtToolArguments): string => args.collectionId ?? id(args)
const shareId = (args: MgmtToolArguments): string => args.shareId ?? id(args)
const packageId = (args: MgmtToolArguments): string => args.packageId ?? id(args)
const notificationId = (args: MgmtToolArguments): string => args.notificationId ?? id(args)
const periodId = (args: MgmtToolArguments): string => args.periodId ?? id(args)
const roleId = (args: MgmtToolArguments): string => args.roleId ?? id(args)
const blueprintId = (args: MgmtToolArguments): string => args.blueprintId ?? id(args)

/** Pulls `asset_ids` out of an untrusted payload for the collection endpoints. */
const assetIds = (args: MgmtToolArguments): string[] => (payload(args).asset_ids as string[]) ?? []

export const operations: OperationDefinition[] = [
  // ─── System ─────────────────────────────────────────────────────────────────
  {
    name: 'system.health',
    description: 'Check Management API health.',
    handler: (client) => client.system.health(),
  },
  {
    name: 'system.config',
    description: 'Read public Management API configuration.',
    handler: (client) => client.system.getConfig(),
  },

  // ─── Users ──────────────────────────────────────────────────────────────────
  {
    name: 'users.me',
    description: 'Read the authenticated user.',
    handler: (client) => client.users.getMe(),
  },
  {
    name: 'users.updateMe',
    description: 'Update the authenticated user profile.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.users.updateMe(payload(args)),
  },

  // ─── Teams ──────────────────────────────────────────────────────────────────
  {
    name: 'teams.list',
    description: 'List teams.',
    accepts: ['params'],
    handler: (client, args) => client.teams.list(params(args)),
  },
  {
    name: 'teams.create',
    description: 'Create a team.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.teams.create(payload(args) as never),
  },
  {
    name: 'teams.get',
    description: 'Get a team by ID.',
    required: ['teamId'],
    accepts: ['teamId'],
    handler: (client, args) => client.teams.get(requireString(args, 'teamId')),
  },
  {
    name: 'teams.update',
    description: 'Update a team.',
    required: ['teamId', 'payload'],
    accepts: ['teamId', 'payload'],
    handler: (client, args) =>
      client.teams.update(requireString(args, 'teamId'), payload(args) as never),
  },
  {
    name: 'teams.delete',
    description: 'Delete a team.',
    required: ['teamId'],
    accepts: ['teamId'],
    handler: (client, args) => client.teams.delete(requireString(args, 'teamId')),
  },
  {
    name: 'teams.hierarchy',
    description: 'Read team hierarchy.',
    handler: (client) => client.teams.getHierarchy(),
  },
  {
    name: 'teams.addUser',
    description: 'Add a user to a team.',
    required: ['teamId', 'payload'],
    accepts: ['teamId', 'payload'],
    handler: (client, args) =>
      client.teams.addUser(requireString(args, 'teamId'), payload(args) as never),
  },
  {
    name: 'teams.removeUser',
    description: 'Remove a user from a team.',
    required: ['teamId', 'userId'],
    accepts: ['teamId', 'userId'],
    handler: (client, args) =>
      client.teams.removeUser(requireString(args, 'teamId'), requireString(args, 'userId')),
  },

  // ─── Spaces ─────────────────────────────────────────────────────────────────
  {
    name: 'spaces.list',
    description: 'List spaces.',
    accepts: ['params'],
    handler: (client, args) => client.spaces.list(params(args)),
  },
  {
    name: 'spaces.create',
    description: 'Create a space.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.spaces.create(payload(args) as never),
  },
  {
    name: 'spaces.get',
    description: 'Get a space by ID.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.get(spaceId(args)),
  },
  {
    name: 'spaces.update',
    description:
      'Update a space. Payload fields: name, slug, icon, color, description, state (active|archived|draft), settings. ' +
      'settings is merged; sitemap config lives in settings.sitemap.types (the default /sitemap, an array of ' +
      '{block, path}) and settings.sitemaps (named sitemaps served under /sitemaps/{slug}, an array of ' +
      '{slug, types: [{block, path}]}), where block is a content block slug and path the dot path to its SEO meta object.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.spaces.update(spaceId(args), payload(args) as never),
  },
  {
    name: 'spaces.delete',
    description: 'Delete a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.delete(spaceId(args)),
  },
  {
    name: 'spaces.updateIcon',
    description: 'Update a space icon.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.spaces.updateIcon(spaceId(args), payload(args) as never),
  },
  {
    name: 'spaces.archive',
    description: 'Archive a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.archive(spaceId(args)),
  },
  {
    name: 'spaces.aiUsage',
    description: 'Read AI usage for a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.getAiUsage(spaceId(args)),
  },
  {
    name: 'spaces.stats',
    description: 'Read stats for a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.getStats(spaceId(args)),
  },
  {
    name: 'spaces.contentMenu',
    description: 'Get the content menu (site structure tree) for a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.getContentMenu(spaceId(args)),
  },
  // Members
  {
    name: 'spaces.listMembers',
    description: 'List members of a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.spaces.listMembers(spaceId(args), params(args)),
  },
  {
    name: 'spaces.updateMember',
    description: 'Update a space member role.',
    required: ['spaceId', 'userId', 'payload'],
    accepts: ['spaceId', 'userId', 'payload'],
    handler: (client, args) =>
      client.spaces.updateMember(
        spaceId(args),
        requireString(args, 'userId'),
        payload(args) as never
      ),
  },
  {
    name: 'spaces.removeMember',
    description: 'Remove a member from a space.',
    required: ['spaceId', 'userId'],
    accepts: ['spaceId', 'userId'],
    handler: (client, args) =>
      client.spaces.removeMember(spaceId(args), requireString(args, 'userId')),
  },
  // Invites
  {
    name: 'spaces.listInvites',
    description: 'List pending invites for a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.spaces.listInvites(spaceId(args), params(args)),
  },
  {
    name: 'spaces.createInvite',
    description: 'Invite a user to a space.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.spaces.createInvite(spaceId(args), payload(args) as never),
  },
  {
    name: 'spaces.deleteInvite',
    description: 'Delete a pending space invite.',
    required: ['spaceId', 'inviteId'],
    accepts: ['spaceId', 'inviteId'],
    handler: (client, args) => client.spaces.deleteInvite(spaceId(args), inviteId(args)),
  },
  {
    name: 'spaces.resendInvite',
    description: 'Resend a space invite email.',
    required: ['spaceId', 'inviteId'],
    accepts: ['spaceId', 'inviteId'],
    handler: (client, args) => client.spaces.resendInvite(spaceId(args), inviteId(args)),
  },
  // Search
  {
    name: 'spaces.updateSearch',
    description: 'Update search configuration for a space.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.spaces.updateSearch(spaceId(args), payload(args)),
  },
  {
    name: 'spaces.reindexSearch',
    description: 'Trigger a full search reindex for a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.reindexSearch(spaceId(args)),
  },
  // Subscriptions
  {
    name: 'spaces.listSubscriptions',
    description: 'List subscription plans available for a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.spaces.listSubscriptions(spaceId(args), queryOpts(args)),
  },
  {
    name: 'spaces.getCurrentSubscription',
    description: 'Get the current active subscription of a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.getCurrentSubscription(spaceId(args)),
  },
  {
    name: 'spaces.checkoutSubscription',
    description: 'Create a checkout session to upgrade/change a space subscription.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) =>
      client.spaces.checkoutSubscription(spaceId(args), payload(args) as never),
  },
  {
    name: 'spaces.reinitSubscription',
    description: 'Reinitialize a space subscription (get a new checkout URL).',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.reinitSubscription(spaceId(args)),
  },
  {
    name: 'spaces.cancelSubscription',
    description: 'Cancel the active subscription for a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.cancelSubscription(spaceId(args)),
  },
  // AI Settings
  {
    name: 'spaces.getAiSettings',
    description: 'Get AI settings for a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.getAiSettings(spaceId(args)),
  },
  {
    name: 'spaces.updateAiSettings',
    description: 'Update AI settings for a space.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) =>
      client.spaces.updateAiSettings(spaceId(args), payload(args) as never),
  },
  // AI Configs
  {
    name: 'spaces.listAiConfigs',
    description: 'List AI configurations for a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.spaces.listAiConfigs(spaceId(args), queryOpts(args)),
  },
  {
    name: 'spaces.createAiConfig',
    description: 'Create an AI configuration for a space.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.spaces.createAiConfig(spaceId(args), payload(args) as never),
  },
  {
    name: 'spaces.getAiConfig',
    description: 'Get an AI configuration by ID.',
    required: ['spaceId', 'configId'],
    accepts: ['spaceId', 'configId'],
    handler: (client, args) => client.spaces.getAiConfig(spaceId(args), configId(args)),
  },
  {
    name: 'spaces.updateAiConfig',
    description: 'Update an AI configuration.',
    required: ['spaceId', 'configId', 'payload'],
    accepts: ['spaceId', 'configId', 'payload'],
    handler: (client, args) =>
      client.spaces.updateAiConfig(spaceId(args), configId(args), payload(args) as never),
  },
  {
    name: 'spaces.deleteAiConfig',
    description: 'Delete an AI configuration.',
    required: ['spaceId', 'configId'],
    accepts: ['spaceId', 'configId'],
    handler: (client, args) => client.spaces.deleteAiConfig(spaceId(args), configId(args)),
  },
  // Audit Logs
  {
    name: 'spaces.getAuditLogs',
    description: 'Get audit logs for a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.spaces.getAuditLogs(spaceId(args), params(args) as never),
  },
  // Backups
  {
    name: 'spaces.listBackups',
    description: 'List backups for a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.spaces.listBackups(spaceId(args), params(args)),
  },
  {
    name: 'spaces.createBackup',
    description: 'Create a backup for a space.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.spaces.createBackup(spaceId(args), payload(args) as never),
  },
  {
    name: 'spaces.getBackup',
    description: 'Get a backup by ID.',
    required: ['spaceId', 'backupId'],
    accepts: ['spaceId', 'backupId'],
    handler: (client, args) => client.spaces.getBackup(spaceId(args), backupId(args)),
  },
  {
    name: 'spaces.updateBackup',
    description: 'Update a backup.',
    required: ['spaceId', 'backupId', 'payload'],
    accepts: ['spaceId', 'backupId', 'payload'],
    handler: (client, args) =>
      client.spaces.updateBackup(spaceId(args), backupId(args), payload(args) as never),
  },
  {
    name: 'spaces.deleteBackup',
    description: 'Delete a backup.',
    required: ['spaceId', 'backupId'],
    accepts: ['spaceId', 'backupId'],
    handler: (client, args) => client.spaces.deleteBackup(spaceId(args), backupId(args)),
  },
  // Migrations
  {
    name: 'spaces.listMigrations',
    description: 'List migrations for a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.spaces.listMigrations(spaceId(args), params(args)),
  },
  {
    name: 'spaces.createMigration',
    description: 'Create a migration for a space.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.spaces.createMigration(spaceId(args), payload(args) as never),
  },

  // ─── Blocks ─────────────────────────────────────────────────────────────────
  {
    name: 'blocks.list',
    description: 'List block definitions in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.blocks.list(spaceId(args), params(args) as never),
  },
  {
    name: 'blocks.create',
    description:
      'Create a block definition. Payload fields: name (string), slug (string, unique), type ("root"|"nestable"|"single"), schema (object mapping field keys to field definitions), editor (array of {header, items} tab groups), tags (string[]), icon (string), color (hex string), preview_template (mustache string). Call b10cks_content_model_guide first for field type options, tag hierarchy, and canonical patterns.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.blocks.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'blocks.get',
    description: 'Get a block definition by ID.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'blockId'],
    handler: (client, args) => client.blocks.get(spaceId(args), blockId(args)),
  },
  {
    name: 'blocks.update',
    description:
      'Update a block definition. Same payload structure as blocks.create — only include fields to change. Schema field keys are stable identifiers; renaming a key creates a new field and loses existing data.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'blockId', 'payload'],
    handler: (client, args) =>
      client.blocks.update(spaceId(args), blockId(args), payload(args) as never),
  },
  {
    name: 'blocks.delete',
    description: 'Delete a block definition.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'blockId'],
    handler: (client, args) => client.blocks.delete(spaceId(args), blockId(args)),
  },
  {
    name: 'blocks.sync',
    description:
      'Reconcile a full set of block definitions against the space in one transaction. Payload: blocks (array of complete block definitions, each REQUIRING external_id, name, slug, type — same block fields as blocks.create), dry_run (boolean — return the created/updated/unchanged/deleted plan without applying; run this first), prune (boolean — soft-delete remote blocks missing from the payload; destructive, only set when explicitly asked), commit_message (string, recorded on block versions). Blocks are matched by external_id, falling back to slug for adopting existing blocks. Updates automatically create restorable block versions. Unlike blocks.create/update this is a declarative full-set operation — always send every block that should exist, not just changed ones.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.blocks.sync(spaceId(args), payload(args) as never),
  },
  // Block Templates
  {
    name: 'blocks.listTemplates',
    description: 'List templates for a block definition.',
    required: ['spaceId', 'blockId'],
    accepts: ['spaceId', 'blockId', 'params'],
    handler: (client, args) =>
      client.blocks.listTemplates(spaceId(args), blockId(args), params(args)),
  },
  {
    name: 'blocks.createTemplate',
    description: 'Create a template for a block definition.',
    required: ['spaceId', 'blockId', 'payload'],
    accepts: ['spaceId', 'blockId', 'payload'],
    handler: (client, args) =>
      client.blocks.createTemplate(spaceId(args), blockId(args), payload(args) as never),
  },
  {
    name: 'blocks.getTemplate',
    description: 'Get a block template by ID.',
    required: ['spaceId', 'blockId', 'templateId'],
    accepts: ['spaceId', 'blockId', 'templateId'],
    handler: (client, args) =>
      client.blocks.getTemplate(spaceId(args), blockId(args), templateId(args)),
  },
  {
    name: 'blocks.updateTemplate',
    description: 'Update a block template.',
    required: ['spaceId', 'blockId', 'templateId', 'payload'],
    accepts: ['spaceId', 'blockId', 'templateId', 'payload'],
    handler: (client, args) =>
      client.blocks.updateTemplate(
        spaceId(args),
        blockId(args),
        templateId(args),
        payload(args) as never
      ),
  },
  {
    name: 'blocks.deleteTemplate',
    description: 'Delete a block template.',
    required: ['spaceId', 'blockId', 'templateId'],
    accepts: ['spaceId', 'blockId', 'templateId'],
    handler: (client, args) =>
      client.blocks.deleteTemplate(spaceId(args), blockId(args), templateId(args)),
  },
  // Block Versions
  {
    name: 'blocks.listVersions',
    description: 'List versions of a block definition.',
    required: ['spaceId', 'blockId'],
    accepts: ['spaceId', 'blockId', 'params'],
    handler: (client, args) =>
      client.blocks.listVersions(spaceId(args), blockId(args), params(args)),
  },
  {
    name: 'blocks.getVersion',
    description: 'Get a specific version of a block definition.',
    required: ['spaceId', 'blockId', 'versionId'],
    accepts: ['spaceId', 'blockId', 'versionId'],
    handler: (client, args) =>
      client.blocks.getVersion(spaceId(args), blockId(args), versionId(args)),
  },
  {
    name: 'blocks.updateVersion',
    description: 'Update a block version.',
    required: ['spaceId', 'blockId', 'versionId', 'payload'],
    accepts: ['spaceId', 'blockId', 'versionId', 'payload'],
    handler: (client, args) =>
      client.blocks.updateVersion(
        spaceId(args),
        blockId(args),
        versionId(args),
        payload(args) as never
      ),
  },
  {
    name: 'blocks.deleteVersion',
    description: 'Delete a block version.',
    required: ['spaceId', 'blockId', 'versionId'],
    accepts: ['spaceId', 'blockId', 'versionId'],
    handler: (client, args) =>
      client.blocks.deleteVersion(spaceId(args), blockId(args), versionId(args)),
  },
  {
    name: 'blocks.restoreVersion',
    description: 'Restore a block version as the current definition.',
    required: ['spaceId', 'blockId', 'versionId'],
    accepts: ['spaceId', 'blockId', 'versionId'],
    handler: (client, args) =>
      client.blocks.restoreVersion(spaceId(args), blockId(args), versionId(args)),
  },

  // ─── Contents ───────────────────────────────────────────────────────────────
  {
    name: 'contents.list',
    description: 'List content entries in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.contents.list(spaceId(args), params(args) as never),
  },
  {
    name: 'contents.create',
    description: 'Create a content entry.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.contents.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'contents.get',
    description: 'Get a content entry by ID.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId'],
    handler: (client, args) => client.contents.get(spaceId(args), contentId(args)),
  },
  {
    name: 'contents.update',
    description: 'Update a content entry.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'contentId', 'payload'],
    handler: (client, args) =>
      client.contents.update(spaceId(args), contentId(args), payload(args) as never),
  },
  {
    name: 'contents.delete',
    description: 'Delete a content entry.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId'],
    handler: (client, args) => client.contents.delete(spaceId(args), contentId(args)),
  },
  {
    name: 'contents.bulkCreate',
    description: 'Bulk-create multiple content entries at once.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.contents.bulkCreate(spaceId(args), payload(args) as never),
  },
  {
    name: 'contents.treeOperations',
    description: 'Perform batch tree operations on content (move, reorder, nest).',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) =>
      client.contents.treeOperations(spaceId(args), payload(args) as never),
  },
  {
    name: 'contents.move',
    description: 'Move a content entry to a different parent or position.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'contentId', 'payload'],
    handler: (client, args) =>
      client.contents.move(spaceId(args), contentId(args), payload(args) as never),
  },
  {
    name: 'contents.publish',
    description: 'Publish a content entry.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId', 'payload'],
    handler: (client, args) =>
      client.contents.publish(spaceId(args), contentId(args), payload(args) as never),
  },
  {
    name: 'contents.unpublish',
    description: 'Unpublish a content entry.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId'],
    handler: (client, args) => client.contents.unpublish(spaceId(args), contentId(args)),
  },
  {
    name: 'contents.schedule',
    description: 'Schedule a content entry for publish/unpublish at a specific time.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'contentId', 'payload'],
    handler: (client, args) =>
      client.contents.schedule(spaceId(args), contentId(args), payload(args) as never),
  },
  // Content Versions
  {
    name: 'contents.listVersions',
    description: 'List versions of a content entry.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId', 'params'],
    handler: (client, args) =>
      client.contents.listVersions(spaceId(args), contentId(args), params(args)),
  },
  {
    name: 'contents.getVersion',
    description: 'Get a specific version of a content entry.',
    required: ['spaceId', 'id', 'versionId'],
    accepts: ['spaceId', 'id', 'contentId', 'versionId'],
    handler: (client, args) =>
      client.contents.getVersion(spaceId(args), contentId(args), versionId(args)),
  },
  {
    name: 'contents.updateVersion',
    description: 'Update a content version (e.g. set a label/message).',
    required: ['spaceId', 'id', 'versionId', 'payload'],
    accepts: ['spaceId', 'id', 'contentId', 'versionId', 'payload'],
    handler: (client, args) =>
      client.contents.updateVersion(
        spaceId(args),
        contentId(args),
        versionId(args),
        payload(args) as never
      ),
  },
  {
    name: 'contents.publishVersion',
    description: 'Publish a specific content version.',
    required: ['spaceId', 'id', 'versionId'],
    accepts: ['spaceId', 'id', 'contentId', 'versionId'],
    handler: (client, args) =>
      client.contents.publishVersion(spaceId(args), contentId(args), versionId(args)),
  },
  {
    name: 'contents.setVersionAsCurrent',
    description: 'Set a content version as the current draft.',
    required: ['spaceId', 'id', 'versionId'],
    accepts: ['spaceId', 'id', 'contentId', 'versionId'],
    handler: (client, args) =>
      client.contents.setVersionAsCurrent(spaceId(args), contentId(args), versionId(args)),
  },

  // ─── Comments ───────────────────────────────────────────────────────────────
  {
    name: 'comments.list',
    description: 'List comments on a content entry.',
    required: ['spaceId', 'contentId'],
    accepts: ['spaceId', 'contentId', 'params'],
    handler: (client, args) => client.comments.list(spaceId(args), contentId(args), params(args)),
  },
  {
    name: 'comments.create',
    description: 'Add a comment to a content entry.',
    required: ['spaceId', 'contentId', 'payload'],
    accepts: ['spaceId', 'contentId', 'payload'],
    handler: (client, args) =>
      client.comments.create(spaceId(args), contentId(args), payload(args) as never),
  },
  {
    name: 'comments.get',
    description: 'Get a comment by ID.',
    required: ['spaceId', 'contentId', 'commentId'],
    accepts: ['spaceId', 'contentId', 'commentId'],
    handler: (client, args) => client.comments.get(spaceId(args), contentId(args), commentId(args)),
  },
  {
    name: 'comments.update',
    description: 'Update a comment.',
    required: ['spaceId', 'contentId', 'commentId', 'payload'],
    accepts: ['spaceId', 'contentId', 'commentId', 'payload'],
    handler: (client, args) =>
      client.comments.update(
        spaceId(args),
        contentId(args),
        commentId(args),
        payload(args) as never
      ),
  },
  {
    name: 'comments.delete',
    description: 'Delete a comment.',
    required: ['spaceId', 'contentId', 'commentId'],
    accepts: ['spaceId', 'contentId', 'commentId'],
    handler: (client, args) =>
      client.comments.delete(spaceId(args), contentId(args), commentId(args)),
  },
  {
    name: 'comments.resolve',
    description: 'Mark a comment as resolved.',
    required: ['spaceId', 'contentId', 'commentId'],
    accepts: ['spaceId', 'contentId', 'commentId'],
    handler: (client, args) =>
      client.comments.resolve(spaceId(args), contentId(args), commentId(args)),
  },
  {
    name: 'comments.unresolve',
    description: 'Mark a comment as unresolved.',
    required: ['spaceId', 'contentId', 'commentId'],
    accepts: ['spaceId', 'contentId', 'commentId'],
    handler: (client, args) =>
      client.comments.unresolve(spaceId(args), contentId(args), commentId(args)),
  },
  {
    name: 'comments.listReactions',
    description: 'List reactions on a comment.',
    required: ['spaceId', 'contentId', 'commentId'],
    accepts: ['spaceId', 'contentId', 'commentId', 'params'],
    handler: (client, args) =>
      client.comments.listReactions(
        spaceId(args),
        contentId(args),
        commentId(args),
        queryOpts(args)
      ),
  },
  {
    name: 'comments.addReaction',
    description: 'Add a reaction to a comment.',
    required: ['spaceId', 'contentId', 'commentId', 'payload'],
    accepts: ['spaceId', 'contentId', 'commentId', 'payload'],
    handler: (client, args) =>
      client.comments.addReaction(
        spaceId(args),
        contentId(args),
        commentId(args),
        payload(args) as never
      ),
  },
  {
    name: 'comments.removeReaction',
    description: 'Remove your reaction from a comment.',
    required: ['spaceId', 'contentId', 'commentId'],
    accepts: ['spaceId', 'contentId', 'commentId'],
    handler: (client, args) =>
      client.comments.removeReaction(spaceId(args), contentId(args), commentId(args)),
  },

  // ─── Redirects ──────────────────────────────────────────────────────────────
  {
    name: 'redirects.exportData',
    description: 'Export redirects as CSV/JSON.',
    required: ['spaceId'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.redirects.exportData(spaceId(args), payload(args)),
  },
  {
    name: 'redirects.importData',
    description: 'Import redirects from CSV/JSON.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.redirects.importData(spaceId(args), payload(args)),
  },

  // ─── Data Sources ────────────────────────────────────────────────────────────
  {
    name: 'dataSources.exportEntries',
    description: 'Export data source entries.',
    required: ['spaceId', 'dataSourceId'],
    accepts: ['spaceId', 'dataSourceId', 'payload'],
    handler: (client, args) =>
      client.dataSources.exportEntries(spaceId(args), dataSourceId(args), payload(args)),
  },
  {
    name: 'dataSources.importEntries',
    description: 'Import entries into a data source.',
    required: ['spaceId', 'dataSourceId', 'payload'],
    accepts: ['spaceId', 'dataSourceId', 'payload'],
    handler: (client, args) =>
      client.dataSources.importEntries(spaceId(args), dataSourceId(args), payload(args)),
  },
  {
    name: 'dataSources.translateMissingDimensions',
    description: 'Trigger AI translation for missing locale dimensions in a data source.',
    required: ['spaceId', 'dataSourceId'],
    accepts: ['spaceId', 'dataSourceId', 'payload'],
    handler: (client, args) =>
      client.dataSources.translateMissingDimensions(
        spaceId(args),
        dataSourceId(args),
        payload(args)
      ),
  },

  // ─── Automations ─────────────────────────────────────────────────────────────
  // Actions
  {
    name: 'automations.listActions',
    description: 'List automation actions in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.automations.listActions(spaceId(args), params(args)),
  },
  {
    name: 'automations.createAction',
    description: 'Create an automation action.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) =>
      client.automations.createAction(spaceId(args), payload(args) as never),
  },
  {
    name: 'automations.getAction',
    description: 'Get an automation action by ID.',
    required: ['spaceId', 'actionId'],
    accepts: ['spaceId', 'actionId'],
    handler: (client, args) => client.automations.getAction(spaceId(args), actionId(args)),
  },
  {
    name: 'automations.updateAction',
    description: 'Update an automation action.',
    required: ['spaceId', 'actionId', 'payload'],
    accepts: ['spaceId', 'actionId', 'payload'],
    handler: (client, args) =>
      client.automations.updateAction(spaceId(args), actionId(args), payload(args) as never),
  },
  {
    name: 'automations.deleteAction',
    description: 'Delete an automation action.',
    required: ['spaceId', 'actionId'],
    accepts: ['spaceId', 'actionId'],
    handler: (client, args) => client.automations.deleteAction(spaceId(args), actionId(args)),
  },
  // Automation CRUD
  {
    name: 'automations.getTriggerCatalog',
    description: 'Get the catalog of available automation triggers.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.automations.getTriggerCatalog(spaceId(args)),
  },
  {
    name: 'automations.list',
    description: 'List automations in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.automations.list(spaceId(args), params(args)),
  },
  {
    name: 'automations.create',
    description: 'Create an automation.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.automations.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'automations.get',
    description: 'Get an automation by ID.',
    required: ['spaceId', 'automationId'],
    accepts: ['spaceId', 'automationId'],
    handler: (client, args) => client.automations.get(spaceId(args), automationId(args)),
  },
  {
    name: 'automations.update',
    description: 'Update an automation.',
    required: ['spaceId', 'automationId', 'payload'],
    accepts: ['spaceId', 'automationId', 'payload'],
    handler: (client, args) =>
      client.automations.update(spaceId(args), automationId(args), payload(args) as never),
  },
  {
    name: 'automations.delete',
    description: 'Delete an automation.',
    required: ['spaceId', 'automationId'],
    accepts: ['spaceId', 'automationId'],
    handler: (client, args) => client.automations.delete(spaceId(args), automationId(args)),
  },
  {
    name: 'automations.trigger',
    description: 'Manually trigger an automation.',
    required: ['spaceId', 'automationId'],
    accepts: ['spaceId', 'automationId', 'payload'],
    handler: (client, args) =>
      client.automations.trigger(spaceId(args), automationId(args), payload(args)),
  },
  // Stats
  {
    name: 'automations.statsExecutions',
    description: 'Get execution count stats for an automation.',
    required: ['spaceId', 'automationId'],
    accepts: ['spaceId', 'automationId', 'params'],
    handler: (client, args) =>
      client.automations.getStatsExecutions(
        spaceId(args),
        automationId(args),
        params(args) as never
      ),
  },
  {
    name: 'automations.statsTrends',
    description: 'Get trend stats for an automation.',
    required: ['spaceId', 'automationId'],
    accepts: ['spaceId', 'automationId', 'params'],
    handler: (client, args) =>
      client.automations.getStatsTrends(spaceId(args), automationId(args), params(args) as never),
  },
  {
    name: 'automations.statsStatistics',
    description: 'Get detailed statistics for an automation.',
    required: ['spaceId', 'automationId'],
    accepts: ['spaceId', 'automationId', 'params'],
    handler: (client, args) =>
      client.automations.getStatsStatistics(
        spaceId(args),
        automationId(args),
        params(args) as never
      ),
  },
  {
    name: 'automations.statsSummary',
    description: 'Get a summary of automation statistics.',
    required: ['spaceId', 'automationId'],
    accepts: ['spaceId', 'automationId', 'params'],
    handler: (client, args) =>
      client.automations.getStatsSummary(spaceId(args), automationId(args), params(args) as never),
  },
  // Executions
  {
    name: 'automations.listExecutions',
    description: 'List automation execution history.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) =>
      client.automations.listExecutions(spaceId(args), params(args) as never),
  },
  {
    name: 'automations.replayExecution',
    description: 'Replay a failed or completed automation execution.',
    required: ['spaceId', 'executionId'],
    accepts: ['spaceId', 'executionId'],
    handler: (client, args) => client.automations.replayExecution(spaceId(args), executionId(args)),
  },

  // ─── Releases ────────────────────────────────────────────────────────────────
  {
    name: 'releases.list',
    description: 'List releases in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.releases.list(spaceId(args), params(args)),
  },
  {
    name: 'releases.create',
    description: 'Create a release.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.releases.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'releases.get',
    description: 'Get a release by ID.',
    required: ['spaceId', 'releaseId'],
    accepts: ['spaceId', 'releaseId'],
    handler: (client, args) => client.releases.get(spaceId(args), releaseId(args)),
  },
  {
    name: 'releases.update',
    description: 'Update a release.',
    required: ['spaceId', 'releaseId', 'payload'],
    accepts: ['spaceId', 'releaseId', 'payload'],
    handler: (client, args) =>
      client.releases.update(spaceId(args), releaseId(args), payload(args) as never),
  },
  {
    name: 'releases.delete',
    description: 'Delete a release.',
    required: ['spaceId', 'releaseId'],
    accepts: ['spaceId', 'releaseId'],
    handler: (client, args) => client.releases.delete(spaceId(args), releaseId(args)),
  },
  {
    name: 'releases.commit',
    description: 'Commit a release (finalize its content snapshot).',
    required: ['spaceId', 'releaseId'],
    accepts: ['spaceId', 'releaseId'],
    handler: (client, args) => client.releases.commit(spaceId(args), releaseId(args)),
  },
  {
    name: 'releases.cancel',
    description: 'Cancel a release.',
    required: ['spaceId', 'releaseId'],
    accepts: ['spaceId', 'releaseId'],
    handler: (client, args) => client.releases.cancel(spaceId(args), releaseId(args)),
  },
  {
    name: 'releases.publish',
    description: 'Publish all content versions in a release.',
    required: ['spaceId', 'releaseId'],
    accepts: ['spaceId', 'releaseId'],
    handler: (client, args) => client.releases.publish(spaceId(args), releaseId(args)),
  },
  {
    name: 'releases.assignVersion',
    description: 'Assign a content version to a release.',
    required: ['spaceId', 'releaseId', 'payload'],
    accepts: ['spaceId', 'releaseId', 'payload'],
    handler: (client, args) =>
      client.releases.assignVersion(spaceId(args), releaseId(args), payload(args) as never),
  },
  {
    name: 'releases.removeVersion',
    description: 'Remove a content version from a release.',
    required: ['spaceId', 'releaseId', 'payload'],
    accepts: ['spaceId', 'releaseId', 'payload'],
    handler: (client, args) =>
      client.releases.removeVersion(spaceId(args), releaseId(args), payload(args) as never),
  },

  // ─── AI ─────────────────────────────────────────────────────────────────────
  {
    name: 'ai.availableModels',
    description: 'List available AI models.',
    accepts: ['params'],
    handler: (client, args) => client.ai.getAvailableModels(params(args) as never),
  },
  {
    name: 'ai.metaTags',
    description: 'Generate AI meta tags.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.ai.generateMetaTags(payload(args)),
  },
  {
    name: 'ai.translate',
    description: 'Translate content with AI.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.ai.translate(payload(args)),
  },

  // ─── Provider ────────────────────────────────────────────────────────────────
  {
    name: 'provider.getStats',
    description: 'Get provider-level statistics.',
    handler: (client) => client.provider.getStats(),
  },
  {
    name: 'provider.listNotes',
    description: 'List provider notes.',
    accepts: ['params'],
    handler: (client, args) => client.provider.listNotes(params(args)),
  },
  {
    name: 'provider.createNote',
    description: 'Create a provider note.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.provider.createNote(payload(args) as never),
  },
  {
    name: 'provider.getNote',
    description: 'Get a provider note by ID.',
    required: ['noteId'],
    accepts: ['noteId'],
    handler: (client, args) => client.provider.getNote(noteId(args)),
  },
  {
    name: 'provider.updateNote',
    description: 'Update a provider note.',
    required: ['noteId', 'payload'],
    accepts: ['noteId', 'payload'],
    handler: (client, args) => client.provider.updateNote(noteId(args), payload(args) as never),
  },
  {
    name: 'provider.deleteNote',
    description: 'Delete a provider note.',
    required: ['noteId'],
    accepts: ['noteId'],
    handler: (client, args) => client.provider.deleteNote(noteId(args)),
  },
]

// ─── CRUD resources via loop ──────────────────────────────────────────────────

const crudResources = [
  ['assets', 'asset', 'assets', assetId],
  ['assetFolders', 'asset folder', 'assetFolders', folderId],
  ['assetTags', 'asset tag', 'assetTags', tagId],
  ['blockFolders', 'block folder', 'blockFolders', folderId],
  ['blockTags', 'block tag', 'blockTags', tagId],
  ['icons', 'icon', 'icons', iconId],
  ['redirects', 'redirect', 'redirects', redirectId],
  ['dataSources', 'data source', 'dataSources', dataSourceId],
] as const

for (const [prefix, label, clientKey, getId] of crudResources) {
  operations.push(
    {
      name: `${prefix}.list`,
      description: `List ${label}s in a space.`,
      required: ['spaceId'],
      accepts: ['spaceId', 'params'],
      handler: (client, args) =>
        (client[clientKey] as never as { list: (s: string, p?: unknown) => Promise<unknown> }).list(
          spaceId(args),
          params(args)
        ),
    },
    {
      name: `${prefix}.create`,
      description: `Create a ${label}.`,
      required: ['spaceId', 'payload'],
      accepts: ['spaceId', 'payload'],
      handler: (client, args) =>
        (
          client[clientKey] as never as { create: (s: string, p: unknown) => Promise<unknown> }
        ).create(spaceId(args), payload(args)),
    },
    {
      name: `${prefix}.get`,
      description: `Get a ${label} by ID.`,
      required: ['spaceId', 'id'],
      accepts: ['spaceId', 'id'],
      handler: (client, args) =>
        (client[clientKey] as never as { get: (s: string, id: string) => Promise<unknown> }).get(
          spaceId(args),
          getId(args)
        ),
    },
    {
      name: `${prefix}.update`,
      description: `Update a ${label}.`,
      required: ['spaceId', 'id', 'payload'],
      accepts: ['spaceId', 'id', 'payload'],
      handler: (client, args) =>
        (
          client[clientKey] as never as {
            update: (s: string, id: string, p: unknown) => Promise<unknown>
          }
        ).update(spaceId(args), getId(args), payload(args)),
    },
    {
      name: `${prefix}.delete`,
      description: `Delete a ${label}.`,
      required: ['spaceId', 'id'],
      accepts: ['spaceId', 'id'],
      handler: (client, args) =>
        (
          client[clientKey] as never as { delete: (s: string, id: string) => Promise<unknown> }
        ).delete(spaceId(args), getId(args)),
    }
  )
}

operations.push(
  {
    name: 'icons.tags',
    description: 'List distinct tags used across icons in a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.icons.tags(spaceId(args)),
  },
  {
    name: 'assetTags.assign',
    description: 'Assign an asset tag to one or more assets. Payload fields: asset_ids (string[]).',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'tagId', 'payload'],
    handler: (client, args) =>
      client.assetTags.assign(
        spaceId(args),
        tagId(args),
        (payload(args).asset_ids as string[]) ?? []
      ),
  },
  {
    name: 'redirects.reset',
    description: 'Reset redirect hit counters.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'redirectId'],
    handler: (client, args) => client.redirects.reset(spaceId(args), redirectId(args)),
  },
  {
    name: 'tokens.list',
    description: 'List access tokens for a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.tokens.list(spaceId(args), params(args)),
  },
  {
    name: 'tokens.create',
    description: 'Create a space token.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.tokens.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'tokens.delete',
    description: 'Delete a space token.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'tokenId'],
    handler: (client, args) => client.tokens.delete(spaceId(args), tokenId(args)),
  },
  {
    name: 'dataSources.entries.list',
    description: 'List entries in a data source.',
    required: ['spaceId', 'dataSourceId'],
    accepts: ['spaceId', 'dataSourceId', 'params'],
    handler: (client, args) =>
      client.dataSources.listEntries(spaceId(args), dataSourceId(args), params(args)),
  },
  {
    name: 'dataSources.entries.create',
    description: 'Create a data source entry.',
    required: ['spaceId', 'dataSourceId', 'payload'],
    accepts: ['spaceId', 'dataSourceId', 'payload'],
    handler: (client, args) =>
      client.dataSources.createEntry(spaceId(args), dataSourceId(args), payload(args) as never),
  },
  {
    name: 'dataSources.entries.get',
    description: 'Get a data source entry.',
    required: ['spaceId', 'dataSourceId', 'entryId'],
    accepts: ['spaceId', 'dataSourceId', 'entryId'],
    handler: (client, args) =>
      client.dataSources.getEntry(spaceId(args), dataSourceId(args), entryId(args)),
  },
  {
    name: 'dataSources.entries.update',
    description: 'Update a data source entry.',
    required: ['spaceId', 'dataSourceId', 'entryId', 'payload'],
    accepts: ['spaceId', 'dataSourceId', 'entryId', 'payload'],
    handler: (client, args) =>
      client.dataSources.updateEntry(
        spaceId(args),
        dataSourceId(args),
        entryId(args),
        payload(args) as never
      ),
  },
  {
    name: 'dataSources.entries.delete',
    description: 'Delete a data source entry.',
    required: ['spaceId', 'dataSourceId', 'entryId'],
    accepts: ['spaceId', 'dataSourceId', 'entryId'],
    handler: (client, args) =>
      client.dataSources.deleteEntry(spaceId(args), dataSourceId(args), entryId(args)),
  }
)

// ─── Asset Collections ────────────────────────────────────────────────────────

operations.push(
  {
    name: 'assetCollections.list',
    description: 'List asset collections in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.assetCollections.list(spaceId(args), params(args)),
  },
  {
    name: 'assetCollections.create',
    description:
      'Create an asset collection. Payload fields: name (required), description, icon, color, type (manual|smart), rules (required for smart), settings, cover_asset_id, external_id.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.assetCollections.create(spaceId(args), payload(args)),
  },
  {
    name: 'assetCollections.get',
    description: 'Get an asset collection by ID.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'collectionId'],
    handler: (client, args) => client.assetCollections.get(spaceId(args), collectionId(args)),
  },
  {
    name: 'assetCollections.update',
    description: 'Update an asset collection.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'collectionId', 'payload'],
    handler: (client, args) =>
      client.assetCollections.update(spaceId(args), collectionId(args), payload(args)),
  },
  {
    name: 'assetCollections.delete',
    description: 'Delete an asset collection. The assets themselves are kept.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'collectionId'],
    handler: (client, args) => client.assetCollections.delete(spaceId(args), collectionId(args)),
  },
  {
    name: 'assetCollections.listAssets',
    description: 'List the assets in a collection.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'collectionId', 'params'],
    handler: (client, args) =>
      client.assetCollections.listAssets(spaceId(args), collectionId(args), params(args)),
  },
  {
    name: 'assetCollections.addAssets',
    description:
      'Add assets to a manual collection. Payload fields: asset_ids (string[]). Smart collections reject this.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'collectionId', 'payload'],
    handler: (client, args) =>
      client.assetCollections.addAssets(spaceId(args), collectionId(args), assetIds(args)),
  },
  {
    name: 'assetCollections.removeAssets',
    description:
      'Remove assets from a manual collection. Payload fields: asset_ids (string[]). Smart collections reject this.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'collectionId', 'payload'],
    handler: (client, args) =>
      client.assetCollections.removeAssets(spaceId(args), collectionId(args), assetIds(args)),
  },
  {
    name: 'assetCollections.reorderAssets',
    description:
      'Reorder a manual collection. Payload fields: asset_ids (string[]) — the full ordered list.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'collectionId', 'payload'],
    handler: (client, args) =>
      client.assetCollections.reorderAssets(spaceId(args), collectionId(args), assetIds(args)),
  }
)

// ─── Asset Shares & Packages ──────────────────────────────────────────────────

operations.push(
  {
    name: 'assetShares.list',
    description: 'List asset shares in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.assetShares.list(spaceId(args), params(args)),
  },
  {
    name: 'assetShares.create',
    description:
      'Create a public asset share. Payload fields: name (required), source_type (required: collection|selection|folder), collection_id / folder_id / asset_ids per source_type, description, password, expires_at, download_limit, allow_individual_downloads, settings.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.assetShares.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'assetShares.get',
    description: 'Get an asset share by ID.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'shareId'],
    handler: (client, args) => client.assetShares.get(spaceId(args), shareId(args)),
  },
  {
    name: 'assetShares.update',
    description:
      'Update an asset share. Omit password to keep it, pass null to remove it. Changing the source rebuilds the package.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'shareId', 'payload'],
    handler: (client, args) =>
      client.assetShares.update(spaceId(args), shareId(args), payload(args)),
  },
  {
    name: 'assetShares.delete',
    description: 'Delete an asset share.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'shareId'],
    handler: (client, args) => client.assetShares.delete(spaceId(args), shareId(args)),
  },
  {
    name: 'assetShares.revoke',
    description: 'Revoke an asset share, blocking further public access.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'shareId'],
    handler: (client, args) => client.assetShares.revoke(spaceId(args), shareId(args)),
  },
  {
    name: 'assetPackages.list',
    description: 'List asset packages (zip archives) in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.assetPackages.list(spaceId(args), params(args)),
  },
  {
    name: 'assetPackages.create',
    description:
      'Queue an asset package build. Payload fields: source_type (required: collection|selection|folder), collection_id / folder_id / asset_ids per source_type, name. Poll assetPackages.get until state is completed.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.assetPackages.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'assetPackages.get',
    description: 'Get an asset package, including its build state and progress.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'packageId'],
    handler: (client, args) => client.assetPackages.get(spaceId(args), packageId(args)),
  },
  {
    name: 'assetPackages.delete',
    description: 'Delete an asset package and its archive.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'packageId'],
    handler: (client, args) => client.assetPackages.delete(spaceId(args), packageId(args)),
  },
  {
    name: 'assetPackages.download',
    description:
      'Get a presigned download URL for a built package. Errors with 409 while it is still building.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'packageId'],
    handler: (client, args) => client.assetPackages.download(spaceId(args), packageId(args)),
  }
)

// ─── Public Shares ────────────────────────────────────────────────────────────

operations.push(
  {
    name: 'shares.get',
    description:
      'Read a public share by space id and token. Password-protected shares return only the name unless accessToken is supplied.',
    required: ['spaceId', 'token'],
    accepts: ['spaceId', 'token', 'accessToken'],
    handler: (client, args) =>
      client.shares.get(spaceId(args), requireString(args, 'token'), args.accessToken),
  },
  {
    name: 'shares.unlock',
    description:
      'Exchange a share password for a short-lived access token. Payload fields: password (string).',
    required: ['spaceId', 'token', 'payload'],
    accepts: ['spaceId', 'token', 'payload'],
    handler: (client, args) =>
      client.shares.unlock(
        spaceId(args),
        requireString(args, 'token'),
        String(payload(args).password ?? '')
      ),
  },
  {
    name: 'shares.listAssets',
    description: 'List the assets in a public share.',
    required: ['spaceId', 'token'],
    accepts: ['spaceId', 'token', 'accessToken', 'params'],
    handler: (client, args) =>
      client.shares.listAssets(
        spaceId(args),
        requireString(args, 'token'),
        params(args),
        args.accessToken
      ),
  },
  {
    name: 'shares.download',
    description:
      'Get a download URL for a public share archive. Returns build state while the archive is still being prepared.',
    required: ['spaceId', 'token'],
    accepts: ['spaceId', 'token', 'accessToken'],
    handler: (client, args) =>
      client.shares.download(spaceId(args), requireString(args, 'token'), args.accessToken),
  },
  {
    name: 'shares.downloadAsset',
    description: 'Get a download URL for one asset in a public share.',
    required: ['spaceId', 'token', 'assetId'],
    accepts: ['spaceId', 'token', 'assetId', 'accessToken'],
    handler: (client, args) =>
      client.shares.downloadAsset(
        spaceId(args),
        requireString(args, 'token'),
        assetId(args),
        args.accessToken
      ),
  }
)

// ─── Asset versions ───────────────────────────────────────────────────────────

operations.push(
  {
    name: 'assets.listVersions',
    description: 'List an asset’s file versions, most recent first.',
    required: ['spaceId', 'assetId'],
    accepts: ['spaceId', 'assetId', 'params'],
    handler: (client, args) =>
      client.assets.listVersions(spaceId(args), assetId(args), params(args)),
  },
  {
    name: 'assets.restoreVersion',
    description:
      'Restore an asset to an earlier version. The current file is snapshotted first, so this is reversible.',
    required: ['spaceId', 'assetId', 'versionId'],
    accepts: ['spaceId', 'assetId', 'versionId'],
    handler: (client, args) =>
      client.assets.restoreVersion(spaceId(args), assetId(args), versionId(args)),
  },
  {
    name: 'assets.linkedContents',
    description: 'List the contents that reference an asset.',
    required: ['spaceId', 'assetId'],
    accepts: ['spaceId', 'assetId'],
    handler: (client, args) => client.assets.getLinkedContents(spaceId(args), assetId(args)),
  },
  {
    name: 'assets.export',
    description: 'Export asset metadata.',
    required: ['spaceId'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.assets.exportData(spaceId(args), payload(args)),
  }
)

// ─── Notifications ────────────────────────────────────────────────────────────

operations.push(
  {
    name: 'notifications.list',
    description:
      'List the authenticated user’s notifications. Params: unread_only (bool), type (string), page, per_page.',
    accepts: ['params'],
    handler: (client, args) => client.users.listNotifications(params(args)),
  },
  {
    name: 'notifications.unreadCount',
    description: 'Count the authenticated user’s unread notifications.',
    handler: (client) => client.users.getUnreadNotificationCount(),
  },
  {
    name: 'notifications.markRead',
    description: 'Mark one notification as read.',
    required: ['id'],
    accepts: ['id', 'notificationId'],
    handler: (client, args) => client.users.markNotificationAsRead(notificationId(args)),
  },
  {
    name: 'notifications.markUnread',
    description: 'Mark one notification as unread.',
    required: ['id'],
    accepts: ['id', 'notificationId'],
    handler: (client, args) => client.users.markNotificationAsUnread(notificationId(args)),
  },
  {
    name: 'notifications.markAllRead',
    description: 'Mark every notification as read.',
    handler: (client) => client.users.markAllNotificationsAsRead(),
  },
  {
    name: 'notifications.delete',
    description: 'Delete one notification.',
    required: ['id'],
    accepts: ['id', 'notificationId'],
    handler: (client, args) => client.users.deleteNotification(notificationId(args)),
  },
  {
    name: 'notifications.deleteRead',
    description: 'Delete every notification that has already been read.',
    handler: (client) => client.users.deleteReadNotifications(),
  },
  {
    name: 'notifications.deleteAll',
    description: 'Delete every notification, read or not.',
    handler: (client) => client.users.deleteAllNotifications(),
  }
)

// ─── Usage & billing ──────────────────────────────────────────────────────────

operations.push(
  {
    name: 'spaces.usage',
    description: 'Read live usage for the current billing period.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.getUsage(spaceId(args)),
  },
  {
    name: 'spaces.usageHistory',
    description: 'List usage rolled up per billing period, newest first.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.getUsageHistory(spaceId(args)),
  },
  {
    name: 'spaces.usageTimeseries',
    description:
      'Read day-bucketed usage for one billing period. Params: metric (traffic|requests, defaults to traffic).',
    required: ['spaceId', 'periodId'],
    accepts: ['spaceId', 'periodId', 'params'],
    handler: (client, args) =>
      client.spaces.getUsageTimeseries(spaceId(args), periodId(args), params(args)),
  },
  {
    name: 'spaces.listInvoices',
    description: 'List billing invoices for a space.',
    required: ['spaceId'],
    accepts: ['spaceId'],
    handler: (client, args) => client.spaces.listInvoices(spaceId(args)),
  },
  {
    name: 'spaces.updateOnboarding',
    description:
      'Dismiss or restore the space onboarding guide. Payload fields: dismissed (boolean, required).',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) =>
      client.spaces.updateOnboarding(spaceId(args), payload(args) as never),
  },
  {
    name: 'spaces.getMigration',
    description: 'Get a space migration by ID.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'migrationId'],
    handler: (client, args) =>
      client.spaces.getMigration(spaceId(args), args.migrationId ?? id(args)),
  },
  {
    name: 'spaces.deleteMigration',
    description: 'Delete a space migration.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'migrationId'],
    handler: (client, args) =>
      client.spaces.deleteMigration(spaceId(args), args.migrationId ?? id(args)),
  }
)

// ─── Contents export ──────────────────────────────────────────────────────────

operations.push({
  name: 'contents.export',
  description:
    'Export content. Payload fields: as (required: csv|excel|json|xliff|yaml) plus any content list filter.',
  required: ['spaceId', 'payload'],
  accepts: ['spaceId', 'payload'],
  handler: (client, args) => client.contents.exportData(spaceId(args), payload(args) as never),
})

// ─── System ───────────────────────────────────────────────────────────────────

operations.push(
  {
    name: 'system.plans',
    description: 'List the available subscription plans.',
    handler: (client) => client.system.getPlans(),
  },
  {
    name: 'system.authorization',
    description:
      'Read the caller’s effective permissions. Params: team_id or space_id to resolve one context.',
    accepts: ['params'],
    handler: (client, args) => client.system.getAuthorization(params(args)),
  },
  {
    name: 'system.spaceBlueprints',
    description: 'List the space blueprints the caller can create a space from.',
    accepts: ['params'],
    handler: (client, args) => client.system.listSpaceBlueprints(params(args)),
  },
  {
    name: 'system.getInvite',
    description: 'Read a public invite by ID, without authenticating.',
    required: ['id'],
    accepts: ['id', 'inviteId'],
    handler: (client, args) => client.system.getInvite(inviteId(args)),
  }
)

// ─── AI ───────────────────────────────────────────────────────────────────────

operations.push(
  {
    name: 'ai.models',
    description: 'List the AI models configured for the caller.',
    handler: (client) => client.ai.getModels(),
  },
  {
    name: 'ai.contentInteraction',
    description:
      'Run an AI interaction against a content entry. Returns the raw server-sent event stream as text.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.ai.contentInteractionStream(payload(args)),
  },
  {
    name: 'ai.contentTreeInteraction',
    description:
      'Run an AI interaction against a content tree. Returns the raw server-sent event stream as text.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.ai.contentTreeInteractionStream(payload(args)),
  }
)

// ─── Teams ────────────────────────────────────────────────────────────────────

operations.push(
  {
    name: 'teams.listMembers',
    description: 'List team members. Params: role, name, email, q, isActive, sort, page, per_page.',
    required: ['teamId'],
    accepts: ['teamId', 'params'],
    handler: (client, args) => client.teams.listMembers(teamId(args), params(args)),
  },
  {
    name: 'teams.updateMember',
    description: 'Update a team member’s role. Payload fields: role (string|null).',
    required: ['teamId', 'userId', 'payload'],
    accepts: ['teamId', 'userId', 'payload'],
    handler: (client, args) =>
      client.teams.updateMember(teamId(args), userId(args), payload(args) as never),
  },
  {
    name: 'teams.removeMember',
    description: 'Remove a member from a team.',
    required: ['teamId', 'userId'],
    accepts: ['teamId', 'userId'],
    handler: (client, args) => client.teams.removeMember(teamId(args), userId(args)),
  },
  {
    name: 'teams.updateUser',
    description: 'Update a team user.',
    required: ['teamId', 'userId', 'payload'],
    accepts: ['teamId', 'userId', 'payload'],
    handler: (client, args) =>
      client.teams.updateUser(teamId(args), userId(args), payload(args) as never),
  },
  {
    name: 'teams.listInvites',
    description: 'List pending team invites.',
    required: ['teamId'],
    accepts: ['teamId', 'params'],
    handler: (client, args) => client.teams.listInvites(teamId(args), params(args)),
  },
  {
    name: 'teams.createInvite',
    description: 'Invite someone to a team. Payload fields: email (required), role, message.',
    required: ['teamId', 'payload'],
    accepts: ['teamId', 'payload'],
    handler: (client, args) => client.teams.createInvite(teamId(args), payload(args) as never),
  },
  {
    name: 'teams.deleteInvite',
    description: 'Delete a team invite.',
    required: ['teamId', 'inviteId'],
    accepts: ['teamId', 'inviteId'],
    handler: (client, args) => client.teams.deleteInvite(teamId(args), inviteId(args)),
  },
  {
    name: 'teams.resendInvite',
    description: 'Resend a team invite email.',
    required: ['teamId', 'inviteId'],
    accepts: ['teamId', 'inviteId'],
    handler: (client, args) => client.teams.resendInvite(teamId(args), inviteId(args)),
  },
  {
    name: 'teams.getSamlProvider',
    description: 'Read a team’s SAML provider configuration.',
    required: ['teamId'],
    accepts: ['teamId'],
    handler: (client, args) => client.teams.getSamlProvider(teamId(args)),
  },
  {
    name: 'teams.upsertSamlProvider',
    description: 'Create or replace a team’s SAML provider configuration.',
    required: ['teamId', 'payload'],
    accepts: ['teamId', 'payload'],
    handler: (client, args) =>
      client.teams.upsertSamlProvider(teamId(args), payload(args) as never),
  },
  {
    name: 'teams.deleteSamlProvider',
    description: 'Delete a team’s SAML provider configuration.',
    required: ['teamId'],
    accepts: ['teamId'],
    handler: (client, args) => client.teams.deleteSamlProvider(teamId(args)),
  },
  {
    name: 'teams.listBlueprints',
    description: 'List a team’s space blueprints.',
    required: ['teamId'],
    accepts: ['teamId', 'params'],
    handler: (client, args) => client.teams.listBlueprints(teamId(args), params(args)),
  },
  {
    name: 'teams.createBlueprint',
    description:
      'Create a space blueprint. Payload fields: name (required), icon, color, description, settings, data.',
    required: ['teamId', 'payload'],
    accepts: ['teamId', 'payload'],
    handler: (client, args) => client.teams.createBlueprint(teamId(args), payload(args) as never),
  },
  {
    name: 'teams.getBlueprint',
    description: 'Get a space blueprint by ID.',
    required: ['teamId', 'id'],
    accepts: ['teamId', 'id', 'blueprintId'],
    handler: (client, args) => client.teams.getBlueprint(teamId(args), blueprintId(args)),
  },
  {
    name: 'teams.updateBlueprint',
    description: 'Update a space blueprint.',
    required: ['teamId', 'id', 'payload'],
    accepts: ['teamId', 'id', 'blueprintId', 'payload'],
    handler: (client, args) =>
      client.teams.updateBlueprint(teamId(args), blueprintId(args), payload(args) as never),
  },
  {
    name: 'teams.deleteBlueprint',
    description: 'Delete a space blueprint.',
    required: ['teamId', 'id'],
    accepts: ['teamId', 'id', 'blueprintId'],
    handler: (client, args) => client.teams.deleteBlueprint(teamId(args), blueprintId(args)),
  },
  {
    name: 'teams.listSpaceRoles',
    description: 'List the space roles defined for a team.',
    required: ['teamId'],
    accepts: ['teamId'],
    handler: (client, args) => client.teams.listSpaceRoles(teamId(args)),
  },
  {
    name: 'teams.createSpaceRole',
    description:
      'Create a space role. Payload fields: name (required), key, description, abilities.',
    required: ['teamId', 'payload'],
    accepts: ['teamId', 'payload'],
    handler: (client, args) => client.teams.createSpaceRole(teamId(args), payload(args) as never),
  },
  {
    name: 'teams.updateSpaceRole',
    description: 'Update a space role.',
    required: ['teamId', 'id', 'payload'],
    accepts: ['teamId', 'id', 'roleId', 'payload'],
    handler: (client, args) =>
      client.teams.updateSpaceRole(teamId(args), roleId(args), payload(args) as never),
  },
  {
    name: 'teams.deleteSpaceRole',
    description: 'Delete a space role.',
    required: ['teamId', 'id'],
    accepts: ['teamId', 'id', 'roleId'],
    handler: (client, args) => client.teams.deleteSpaceRole(teamId(args), roleId(args)),
  }
)

// ─── Users ────────────────────────────────────────────────────────────────────

operations.push(
  {
    name: 'users.updateSettings',
    description: 'Update the authenticated user’s settings.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.users.updateSettings(payload(args)),
  },
  {
    name: 'users.updatePassword',
    description:
      'Change the authenticated user’s password. Payload fields: current_password, password, password_confirmation.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.users.updatePassword(payload(args) as never),
  },
  {
    name: 'users.listSocialLinks',
    description: 'List the authenticated user’s linked social accounts.',
    handler: (client) => client.users.listSocialLinks(),
  },
  {
    name: 'users.deleteSocialLink',
    description: 'Unlink a social account by provider name.',
    required: ['provider'],
    accepts: ['provider'],
    handler: (client, args) => client.users.deleteSocialLink(requireString(args, 'provider')),
  },
  {
    name: 'users.listTokens',
    description: 'List the authenticated user’s personal access tokens.',
    accepts: ['params'],
    handler: (client, args) => client.users.listTokens(params(args)),
  },
  {
    name: 'users.createToken',
    description: 'Create a personal access token. Payload fields: name (required), abilities.',
    required: ['payload'],
    accepts: ['payload'],
    handler: (client, args) => client.users.createToken(payload(args) as never),
  },
  {
    name: 'users.deleteToken',
    description: 'Delete a personal access token.',
    required: ['id'],
    accepts: ['id', 'tokenId'],
    handler: (client, args) => client.users.deleteToken(tokenId(args)),
  },
  {
    name: 'users.listInvites',
    description: 'List invites addressed to the authenticated user.',
    handler: (client) => client.users.listInvites(),
  },
  {
    name: 'users.getInvite',
    description: 'Get one invite addressed to the authenticated user.',
    required: ['id'],
    accepts: ['id', 'inviteId'],
    handler: (client, args) => client.users.getInvite(inviteId(args)),
  },
  {
    name: 'users.acceptInvite',
    description: 'Accept an invite addressed to the authenticated user.',
    required: ['id'],
    accepts: ['id', 'inviteId'],
    handler: (client, args) => client.users.acceptInvite(inviteId(args)),
  }
)

export const operationMap = new Map(operations.map((operation) => [operation.name, operation]))
