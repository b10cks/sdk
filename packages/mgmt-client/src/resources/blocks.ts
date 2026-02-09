import type { HttpClient } from '../http-client'
import type { Block, GetBlocksParams, PaginatedResponse, RequestOptions } from '../types'

export class BlocksResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetBlocksParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Block>> {
    return this.client.get<PaginatedResponse<Block>>(
      `/mgmt/v1/spaces/${spaceId}/blocks`,
      params,
      options?.headers
    )
  }

  async create(spaceId: string, payload: Partial<Block>, options?: RequestOptions): Promise<Block> {
    return this.client.post<Block>(`/mgmt/v1/spaces/${spaceId}/blocks`, payload, options?.headers)
  }

  async get(spaceId: string, blockId: string, options?: RequestOptions): Promise<Block> {
    return this.client.get<Block>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    blockId: string,
    payload: Partial<Block>,
    options?: RequestOptions
  ): Promise<Block> {
    return this.client.put<Block>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, blockId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`,
      options?.headers
    )
  }
}
