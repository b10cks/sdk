import { ManagementApiError, ManagementClient } from '@b10cks/mgmt-client'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { operationMap, operations, type MgmtToolArguments } from './operations'
import { CONTENT_MODEL_GUIDE, readResource, RESOURCES } from './resources'

export interface ServerConfig {
  baseUrl: string
  token: string
  timeout?: number
}

/**
 * Extracts only safe, structured fields from a Management API error response so
 * they can be surfaced to the MCP caller without leaking the raw response body
 * (which may echo request context or internal detail).
 */
const safeErrorDetails = (response: unknown): Record<string, unknown> => {
  if (!response || typeof response !== 'object') return {}
  const r = response as Record<string, unknown>
  const details: Record<string, unknown> = {}
  if (typeof r.message === 'string') details.message = r.message
  if (typeof r.error === 'string') details.error = r.error
  if (r.errors && typeof r.errors === 'object') details.errors = r.errors
  return details
}

export const createManagementClient = (config: ServerConfig): ManagementClient =>
  new ManagementClient({
    baseUrl: config.baseUrl,
    token: config.token,
    timeout: config.timeout,
  })

export const createServer = (client: ManagementClient | Error): Server => {
  const server = new Server(
    {
      name: '@b10cks/mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  )

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }))

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params
    const content = readResource(uri)

    if (!content) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown resource: ${uri}`)
    }

    return {
      contents: [{ uri, mimeType: 'text/plain', text: content }],
    }
  })

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'b10cks_mgmt_operations',
        description: 'List all supported b10cks Management API operations.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {},
        },
      },
      {
        name: 'b10cks_content_model_guide',
        description:
          'Return the b10cks content modeling guide: block types (root/nestable/single), atomic design tag hierarchy (Atom/Molecule/Organism/Navigation/FormField/Drawer/Listable), all field types with configuration options, editor layout patterns, and canonical block examples derived from a production project. Read this before designing or creating blocks.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {},
        },
      },
      {
        name: 'b10cks_mgmt_call',
        description:
          'Execute a b10cks Management API operation. Before creating or updating blocks, call b10cks_content_model_guide to understand best practices for block types, field types, tag hierarchy, and editor layout.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          required: ['operation'],
          properties: {
            operation: {
              type: 'string',
              description: 'Operation name, for example contents.list or blocks.create.',
              enum: operations.map((operation) => operation.name),
            },
            spaceId: { type: 'string' },
            teamId: { type: 'string' },
            userId: { type: 'string' },
            id: { type: 'string', description: 'Generic resource ID.' },
            folderId: { type: 'string' },
            tagId: { type: 'string' },
            contentId: { type: 'string' },
            blockId: { type: 'string' },
            assetId: { type: 'string' },
            redirectId: { type: 'string' },
            tokenId: { type: 'string' },
            dataSourceId: { type: 'string' },
            entryId: { type: 'string' },
            version: { type: 'number' },
            versionId: { type: 'string', description: 'Version ID (string).' },
            automationId: { type: 'string' },
            actionId: { type: 'string' },
            executionId: { type: 'string' },
            releaseId: { type: 'string' },
            commentId: { type: 'string' },
            templateId: { type: 'string' },
            configId: { type: 'string' },
            backupId: { type: 'string' },
            migrationId: { type: 'string' },
            inviteId: { type: 'string' },
            noteId: { type: 'string' },
            iconId: { type: 'string' },
            collectionId: { type: 'string' },
            shareId: { type: 'string' },
            packageId: { type: 'string' },
            notificationId: { type: 'string' },
            periodId: { type: 'string', description: 'Subscription period ID.' },
            roleId: { type: 'string' },
            blueprintId: { type: 'string' },
            provider: { type: 'string', description: 'Social login provider name.' },
            token: { type: 'string', description: 'Public share token.' },
            accessToken: {
              type: 'string',
              description: 'Access token from shares.unlock, for password-protected shares.',
            },
            params: {
              type: 'object',
              description:
                'Query parameters for list/search operations (e.g. page, per_page, filters).',
              additionalProperties: true,
            },
            payload: {
              type: 'object',
              description: 'JSON request body for create/update/action operations.',
              additionalProperties: true,
            },
          },
        },
      },
    ],
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: toolArguments } = request.params

    if (name === 'b10cks_mgmt_operations') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              operations.map(({ handler: _handler, ...operation }) => operation),
              null,
              2
            ),
          },
        ],
      }
    }

    if (name === 'b10cks_content_model_guide') {
      return { content: [{ type: 'text', text: CONTENT_MODEL_GUIDE }] }
    }

    if (name !== 'b10cks_mgmt_call') {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
    }

    if (client instanceof Error) {
      throw new McpError(
        ErrorCode.InternalError,
        `b10cks MCP server misconfigured: ${client.message}`
      )
    }

    const args = toolArguments as unknown as MgmtToolArguments
    const operation = operationMap.get(args.operation)

    if (!operation) {
      throw new McpError(ErrorCode.InvalidParams, `Unknown operation: ${args.operation}`)
    }

    try {
      const result = await operation.handler(client, args)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result ?? null, null, 2),
          },
        ],
      }
    } catch (error) {
      if (error instanceof ManagementApiError) {
        throw new McpError(
          ErrorCode.InternalError,
          `Management API request failed: ${error.message}`,
          {
            statusCode: error.statusCode,
            // Only surface safe, structured fields — never the raw response
            // body, which can echo request context or internal detail.
            ...safeErrorDetails(error.response),
          }
        )
      }

      throw new McpError(
        ErrorCode.InvalidParams,
        error instanceof Error ? error.message : 'Management API operation failed'
      )
    }
  })

  return server
}

export const runStdioServer = async (configOrError: ServerConfig | Error): Promise<void> => {
  const client =
    configOrError instanceof Error ? configOrError : createManagementClient(configOrError)
  const server = createServer(client)
  const transport = new StdioServerTransport()

  await server.connect(transport)
}
