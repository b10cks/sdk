import type { HttpClient } from '../http-client'
import type { Asset, PaginatedResponse } from '../types'

export class AssetsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string): Promise<PaginatedResponse<Asset>> {
    return this.client.get<PaginatedResponse<Asset>>(`/mgmt/v1/spaces/${spaceId}/assets`)
  }

  async create(spaceId: string): Promise<Asset> {
    return this.client.post<Asset>(`/mgmt/v1/spaces/${spaceId}/assets`)
  }

  async get(spaceId: string, assetId: string): Promise<Asset> {
    return this.client.get<Asset>(`/mgmt/v1/spaces/${spaceId}/assets/${assetId}`)
  }

  async update(spaceId: string, assetId: string): Promise<Asset> {
    return this.client.put<Asset>(`/mgmt/v1/spaces/${spaceId}/assets/${assetId}`)
  }

  async delete(spaceId: string, assetId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/assets/${assetId}`)
  }
}
