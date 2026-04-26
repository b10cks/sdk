import { ManagementApiError, ManagementClient } from '@b10cks/mgmt-client'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'

import { operationMap, operations, type MgmtToolArguments } from './operations'

export interface ServerConfig {
  baseUrl: string
  token: string
  timeout?: number
}

export const createManagementClient = (config: ServerConfig): ManagementClient =>
  new ManagementClient({
    baseUrl: config.baseUrl,
    token: config.token,
    timeout: config.timeout,
  })

export const createServer = (client: ManagementClient): Server => {
  const server = new Server(
    {
      name: '@b10cks/mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

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
        name: 'b10cks_mgmt_call',
        description: 'Execute a b10cks Management API operation.',
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
            params: {
              type: 'object',
              description: 'Query parameters for list/search operations.',
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

    if (name !== 'b10cks_mgmt_call') {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`)
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
            response: error.response,
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

export const runStdioServer = async (config: ServerConfig): Promise<void> => {
  const server = createServer(createManagementClient(config))
  const transport = new StdioServerTransport()

  await server.connect(transport)
}
