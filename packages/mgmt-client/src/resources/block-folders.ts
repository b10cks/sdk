import type { HttpClient } from '../http-client'
import type { BlockFolder, PaginatedResponse } from '../types'

export class BlockFoldersResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string): Promise<PaginatedResponse<BlockFolder>> {
    return this.client.get<PaginatedResponse<BlockFolder>>(`/mgmt/v1/spaces/${spaceId}/block-folders`)
  }

  async create(spaceId: string): Promise<BlockFolder> {
    return this.client.post<BlockFolder>(`/mgmt/v1/spaces/${spaceId}/block-folders`)
  }

  async get(spaceId: string, folderId: string): Promise<BlockFolder> {
    return this.client.get<BlockFolder>(`/mgmt/v1/spaces/${spaceId}/block-folders/${folderId}`)
  }

  async update(spaceId: string, folderId: string): Promise<BlockFolder> {
    return this.client.put<BlockFolder>(`/mgmt/v1/spaces/${spaceId}/block-folders/${folderId}`)
  }

  async delete(spaceId: string, folderId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/block-folders/${folderId}`)
  }
}
