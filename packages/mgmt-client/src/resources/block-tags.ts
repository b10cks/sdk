import type { HttpClient } from '../http-client'
import type { BlockTag, PaginatedResponse, RequestOptions } from '../types'

export class BlockTagsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, options?: RequestOptions): Promise<PaginatedResponse<BlockTag>> {
    return this.client.get<PaginatedResponse<BlockTag>>(
      `/mgmt/v1/spaces/${spaceId}/block-tags`,
      undefined,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: Partial<BlockTag>,
    options?: RequestOptions
  ): Promise<BlockTag> {
    return this.client.post<BlockTag>(
      `/mgmt/v1/spaces/${spaceId}/block-tags`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, tagId: string, options?: RequestOptions): Promise<BlockTag> {
    return this.client.get<BlockTag>(
      `/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`,
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
      `/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, tagId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`,
      options?.headers
    )
  }
}
