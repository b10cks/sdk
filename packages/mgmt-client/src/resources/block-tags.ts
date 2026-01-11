import type { HttpClient } from '../http-client'
import type { BlockTag, PaginatedResponse } from '../types'

export class BlockTagsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string): Promise<PaginatedResponse<BlockTag>> {
    return this.client.get<PaginatedResponse<BlockTag>>(`/mgmt/v1/spaces/${spaceId}/block-tags`)
  }

  async create(spaceId: string): Promise<BlockTag> {
    return this.client.post<BlockTag>(`/mgmt/v1/spaces/${spaceId}/block-tags`)
  }

  async get(spaceId: string, tagId: string): Promise<BlockTag> {
    return this.client.get<BlockTag>(`/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`)
  }

  async update(spaceId: string, tagId: string): Promise<BlockTag> {
    return this.client.put<BlockTag>(`/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`)
  }

  async delete(spaceId: string, tagId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/block-tags/${tagId}`)
  }
}
