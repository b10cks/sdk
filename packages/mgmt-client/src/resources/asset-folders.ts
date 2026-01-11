import type { HttpClient } from '../http-client'
import type { AssetFolder, PaginatedResponse } from '../types'

export class AssetFoldersResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string): Promise<PaginatedResponse<AssetFolder>> {
    return this.client.get<PaginatedResponse<AssetFolder>>(`/mgmt/v1/spaces/${spaceId}/asset-folders`)
  }

  async create(spaceId: string): Promise<AssetFolder> {
    return this.client.post<AssetFolder>(`/mgmt/v1/spaces/${spaceId}/asset-folders`)
  }

  async get(spaceId: string, folderId: string): Promise<AssetFolder> {
    return this.client.get<AssetFolder>(`/mgmt/v1/spaces/${spaceId}/asset-folders/${folderId}`)
  }

  async update(spaceId: string, folderId: string): Promise<AssetFolder> {
    return this.client.put<AssetFolder>(`/mgmt/v1/spaces/${spaceId}/asset-folders/${folderId}`)
  }

  async delete(spaceId: string, folderId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/asset-folders/${folderId}`)
  }
}
