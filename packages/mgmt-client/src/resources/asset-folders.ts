import type { HttpClient } from '../http-client'
import type { AssetFolder, PaginatedResponse, RequestOptions } from '../types'

export class AssetFoldersResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, options?: RequestOptions): Promise<PaginatedResponse<AssetFolder>> {
    return this.client.get<PaginatedResponse<AssetFolder>>(
      `/mgmt/v1/spaces/${spaceId}/asset-folders`,
      undefined,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: Partial<AssetFolder>,
    options?: RequestOptions
  ): Promise<AssetFolder> {
    return this.client.post<AssetFolder>(
      `/mgmt/v1/spaces/${spaceId}/asset-folders`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, folderId: string, options?: RequestOptions): Promise<AssetFolder> {
    return this.client.get<AssetFolder>(
      `/mgmt/v1/spaces/${spaceId}/asset-folders/${folderId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    folderId: string,
    payload: Partial<AssetFolder>,
    options?: RequestOptions
  ): Promise<AssetFolder> {
    return this.client.put<AssetFolder>(
      `/mgmt/v1/spaces/${spaceId}/asset-folders/${folderId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, folderId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/asset-folders/${folderId}`,
      options?.headers
    )
  }
}
