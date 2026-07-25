import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type { BlockTag, PaginatedResponse, PaginationParams, RequestOptions } from '../types'

export class BlockTagsResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<BlockTag>> {
    return this.client.get<PaginatedResponse<BlockTag>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-tags`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: Partial<BlockTag>,
    options?: RequestOptions
  ): Promise<BlockTag> {
    return this.client.post<BlockTag>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-tags`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, tagId: string, options?: RequestOptions): Promise<BlockTag> {
    return this.client.get<BlockTag>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    tagId: string,
    payload: Partial<BlockTag>,
    options?: RequestOptions
  ): Promise<BlockTag> {
    return this.client.put<BlockTag>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, tagId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`,
      options?.headers
    )
  }
}
