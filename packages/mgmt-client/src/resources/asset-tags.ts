import type { HttpClient } from '../http-client'
import type { AssetTag, PaginatedResponse } from '../types'

export class AssetTagsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string): Promise<PaginatedResponse<AssetTag>> {
    return this.client.get<PaginatedResponse<AssetTag>>(`/mgmt/v1/spaces/${spaceId}/asset-tags`)
  }

  async create(spaceId: string): Promise<AssetTag> {
    return this.client.post<AssetTag>(`/mgmt/v1/spaces/${spaceId}/asset-tags`)
  }

  async get(spaceId: string, tagId: string): Promise<AssetTag> {
    return this.client.get<AssetTag>(`/mgmt/v1/spaces/${spaceId}/asset-tags/${tagId}`)
  }

  async update(spaceId: string, tagId: string): Promise<AssetTag> {
    return this.client.put<AssetTag>(`/mgmt/v1/spaces/${spaceId}/asset-tags/${tagId}`)
  }

  async delete(spaceId: string, tagId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/asset-tags/${tagId}`)
  }
}
