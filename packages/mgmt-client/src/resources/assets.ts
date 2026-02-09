import type { HttpClient } from '../http-client'
import type { Asset, PaginatedResponse, RequestOptions } from '../types'

export class AssetsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, options?: RequestOptions): Promise<PaginatedResponse<Asset>> {
    return this.client.get<PaginatedResponse<Asset>>(
      `/mgmt/v1/spaces/${spaceId}/assets`,
      undefined,
      options?.headers
    )
  }

  async create(spaceId: string, payload: Partial<Asset>, options?: RequestOptions): Promise<Asset> {
    return this.client.post<Asset>(`/mgmt/v1/spaces/${spaceId}/assets`, payload, options?.headers)
  }

  async get(spaceId: string, assetId: string, options?: RequestOptions): Promise<Asset> {
    return this.client.get<Asset>(
      `/mgmt/v1/spaces/${spaceId}/assets/${assetId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    assetId: string,
    payload: Partial<Asset>,
    options?: RequestOptions
  ): Promise<Asset> {
    return this.client.put<Asset>(
      `/mgmt/v1/spaces/${spaceId}/assets/${assetId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, assetId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/assets/${assetId}`,
      options?.headers
    )
  }
}
