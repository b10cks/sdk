import type { HttpClient } from '../http-client'
import type {
  AssetTag,
  GetAssetTagsParams,
  PaginatedResponse,
  RequestOptions,
  UpsertAssetTagParams,
} from '../types'

export class AssetTagsResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetAssetTagsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AssetTag>> {
    return this.client.get<PaginatedResponse<AssetTag>>(
      `/mgmt/v1/spaces/${spaceId}/asset-tags`,
      params as Record<string, unknown>,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: UpsertAssetTagParams,
    options?: RequestOptions
  ): Promise<AssetTag> {
    return this.client.post<AssetTag>(
      `/mgmt/v1/spaces/${spaceId}/asset-tags`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, tagId: string, options?: RequestOptions): Promise<AssetTag> {
    return this.client.get<AssetTag>(
      `/mgmt/v1/spaces/${spaceId}/asset-tags/${tagId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    tagId: string,
    payload: Partial<UpsertAssetTagParams>,
    options?: RequestOptions
  ): Promise<AssetTag> {
    return this.client.put<AssetTag>(
      `/mgmt/v1/spaces/${spaceId}/asset-tags/${tagId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, tagId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/asset-tags/${tagId}`,
      options?.headers
    )
  }

  async assign(
    spaceId: string,
    tagId: string,
    assetIds: string[],
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(
      `/mgmt/v1/spaces/${spaceId}/asset-tags/${tagId}/assign`,
      { asset_ids: assetIds },
      options?.headers
    )
  }
}
