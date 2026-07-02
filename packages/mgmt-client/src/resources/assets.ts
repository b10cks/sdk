import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type { Asset, GetAssetsParams, LinkedAssetContent, PaginatedResponse, RequestOptions } from '../types'

export class AssetsResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetAssetsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Asset>> {
    return this.client.get<PaginatedResponse<Asset>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets`,
      params as Record<string, unknown>,
      options?.headers
    )
  }

  async create(spaceId: string, payload: Partial<Asset>, options?: RequestOptions): Promise<Asset> {
    return this.client.post<Asset>(apiPath`/mgmt/v1/spaces/${spaceId}/assets`, payload, options?.headers)
  }

  async get(spaceId: string, assetId: string, options?: RequestOptions): Promise<Asset> {
    return this.client.get<Asset>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/${assetId}`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/${assetId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, assetId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/${assetId}`,
      options?.headers
    )
  }

  async getLinkedContents(
    spaceId: string,
    assetId: string,
    options?: RequestOptions
  ): Promise<{ data: LinkedAssetContent[] }> {
    return this.client.get<{ data: LinkedAssetContent[] }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/${assetId}/linked-contents`,
      undefined,
      options?.headers
    )
  }

  async exportData(
    spaceId: string,
    payload?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/export`,
      payload,
      options?.headers
    )
  }

  async importData(
    spaceId: string,
    payload: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/import`,
      payload,
      options?.headers
    )
  }
}
