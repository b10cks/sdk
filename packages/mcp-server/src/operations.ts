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

const requireNumber = (args: MgmtToolArguments, key: keyof MgmtToolArguments): number => {
  const value = args[key]

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Missing required number argument: ${String(key)}`)
  }

  return value
}

const payload = (args: MgmtToolArguments): Record<string, unknown> => args.payload ?? {}
const params = (args: MgmtToolArguments): Record<string, unknown> | undefined => args.params

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

export const operations: OperationDefinition[] = [
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
  {
    name: 'teams.list',
    description: 'List teams.',
    handler: (client) => client.teams.list(),
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
    description: 'Update a space.',
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
    name: 'blocks.list',
    description: 'List blocks in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.blocks.list(spaceId(args), params(args) as never),
  },
  {
    name: 'blocks.create',
    description: 'Create a block.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.blocks.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'blocks.get',
    description: 'Get a block by ID.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'blockId'],
    handler: (client, args) => client.blocks.get(spaceId(args), blockId(args)),
  },
  {
    name: 'blocks.update',
    description: 'Update a block.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'blockId', 'payload'],
    handler: (client, args) =>
      client.blocks.update(spaceId(args), blockId(args), payload(args) as never),
  },
  {
    name: 'blocks.delete',
    description: 'Delete a block.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'blockId'],
    handler: (client, args) => client.blocks.delete(spaceId(args), blockId(args)),
  },
  {
    name: 'contents.list',
    description: 'List contents in a space.',
    required: ['spaceId'],
    accepts: ['spaceId', 'params'],
    handler: (client, args) => client.contents.list(spaceId(args), params(args) as never),
  },
  {
    name: 'contents.create',
    description: 'Create content.',
    required: ['spaceId', 'payload'],
    accepts: ['spaceId', 'payload'],
    handler: (client, args) => client.contents.create(spaceId(args), payload(args) as never),
  },
  {
    name: 'contents.get',
    description: 'Get content by ID.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId'],
    handler: (client, args) => client.contents.get(spaceId(args), contentId(args)),
  },
  {
    name: 'contents.update',
    description: 'Update content.',
    required: ['spaceId', 'id', 'payload'],
    accepts: ['spaceId', 'id', 'contentId', 'payload'],
    handler: (client, args) =>
      client.contents.update(spaceId(args), contentId(args), payload(args) as never),
  },
  {
    name: 'contents.delete',
    description: 'Delete content.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId'],
    handler: (client, args) => client.contents.delete(spaceId(args), contentId(args)),
  },
  {
    name: 'contents.publish',
    description: 'Publish content.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId', 'payload'],
    handler: (client, args) =>
      client.contents.publish(spaceId(args), contentId(args), payload(args) as never),
  },
  {
    name: 'contents.unpublish',
    description: 'Unpublish content.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'contentId'],
    handler: (client, args) => client.contents.unpublish(spaceId(args), contentId(args)),
  },
  {
    name: 'contents.getVersion',
    description: 'Get a content version.',
    required: ['spaceId', 'id', 'version'],
    accepts: ['spaceId', 'id', 'contentId', 'version'],
    handler: (client, args) =>
      client.contents.getVersion(spaceId(args), contentId(args), requireNumber(args, 'version')),
  },
  {
    name: 'contents.updateVersion',
    description: 'Update a content version.',
    required: ['spaceId', 'id', 'version', 'payload'],
    accepts: ['spaceId', 'id', 'contentId', 'version', 'payload'],
    handler: (client, args) =>
      client.contents.updateVersion(
        spaceId(args),
        contentId(args),
        requireNumber(args, 'version'),
        payload(args) as never
      ),
  },
  {
    name: 'contents.publishVersion',
    description: 'Publish a content version.',
    required: ['spaceId', 'id', 'version'],
    accepts: ['spaceId', 'id', 'contentId', 'version'],
    handler: (client, args) =>
      client.contents.publishVersion(
        spaceId(args),
        contentId(args),
        requireNumber(args, 'version')
      ),
  },
  {
    name: 'contents.setVersionAsCurrent',
    description: 'Set a content version as current.',
    required: ['spaceId', 'id', 'version'],
    accepts: ['spaceId', 'id', 'contentId', 'version'],
    handler: (client, args) =>
      client.contents.setVersionAsCurrent(
        spaceId(args),
        contentId(args),
        requireNumber(args, 'version')
      ),
  },
]

const crudResources = [
  ['assets', 'asset', 'assets', assetId],
  ['assetFolders', 'asset folder', 'assetFolders', folderId],
  ['assetTags', 'asset tag', 'assetTags', tagId],
  ['blockFolders', 'block folder', 'blockFolders', folderId],
  ['blockTags', 'block tag', 'blockTags', tagId],
  ['redirects', 'redirect', 'redirects', redirectId],
  ['dataSources', 'data source', 'dataSources', dataSourceId],
] as const

for (const [prefix, label, clientKey, getId] of crudResources) {
  operations.push(
    {
      name: `${prefix}.list`,
      description: `List ${label}s in a space.`,
      required: ['spaceId'],
      accepts: ['spaceId'],
      handler: (client, args) => client[clientKey].list(spaceId(args)),
    },
    {
      name: `${prefix}.create`,
      description: `Create a ${label}.`,
      required: ['spaceId', 'payload'],
      accepts: ['spaceId', 'payload'],
      handler: (client, args) => client[clientKey].create(spaceId(args), payload(args) as never),
    },
    {
      name: `${prefix}.get`,
      description: `Get a ${label} by ID.`,
      required: ['spaceId', 'id'],
      accepts: ['spaceId', 'id'],
      handler: (client, args) => client[clientKey].get(spaceId(args), getId(args)),
    },
    {
      name: `${prefix}.update`,
      description: `Update a ${label}.`,
      required: ['spaceId', 'id', 'payload'],
      accepts: ['spaceId', 'id', 'payload'],
      handler: (client, args) =>
        client[clientKey].update(spaceId(args), getId(args), payload(args) as never),
    },
    {
      name: `${prefix}.delete`,
      description: `Delete a ${label}.`,
      required: ['spaceId', 'id'],
      accepts: ['spaceId', 'id'],
      handler: (client, args) => client[clientKey].delete(spaceId(args), getId(args)),
    }
  )
}

operations.push(
  {
    name: 'redirects.reset',
    description: 'Reset redirect hit counters.',
    required: ['spaceId', 'id'],
    accepts: ['spaceId', 'id', 'redirectId'],
    handler: (client, args) => client.redirects.reset(spaceId(args), redirectId(args)),
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
    accepts: ['spaceId', 'dataSourceId'],
    handler: (client, args) => client.dataSources.listEntries(spaceId(args), dataSourceId(args)),
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
  },
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
  }
)

export const operationMap = new Map(operations.map((operation) => [operation.name, operation]))
