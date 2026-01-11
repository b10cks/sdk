import type { HttpClient } from '../http-client'
import type { Block, GetBlocksParams, PaginatedResponse } from '../types'

export class BlocksResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, params?: GetBlocksParams): Promise<PaginatedResponse<Block>> {
    return this.client.get<PaginatedResponse<Block>>(`/mgmt/v1/spaces/${spaceId}/blocks`, params)
  }

  async create(spaceId: string): Promise<Block> {
    return this.client.post<Block>(`/mgmt/v1/spaces/${spaceId}/blocks`)
  }

  async get(spaceId: string, blockId: string): Promise<Block> {
    return this.client.get<Block>(`/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`)
  }

  async update(spaceId: string, blockId: string): Promise<Block> {
    return this.client.put<Block>(`/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`)
  }

  async delete(spaceId: string, blockId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`)
  }
}
