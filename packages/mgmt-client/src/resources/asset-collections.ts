import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  Asset,
  AssetCollection,
  GetAssetCollectionsParams,
  GetAssetsParams,
  PaginatedResponse,
  RequestOptions,
  UpsertAssetCollectionParams,
} from '../types'

export class AssetCollectionsResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetAssetCollectionsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AssetCollection>> {
    return this.client.get<PaginatedResponse<AssetCollection>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: UpsertAssetCollectionParams,
    options?: RequestOptions
  ): Promise<{ data: AssetCollection }> {
    return this.client.post<{ data: AssetCollection }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections`,
      payload,
      options?.headers
    )
  }

  async get(
    spaceId: string,
    collectionId: string,
    options?: RequestOptions
  ): Promise<{ data: AssetCollection }> {
    return this.client.get<{ data: AssetCollection }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections/${collectionId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    collectionId: string,
    payload: UpsertAssetCollectionParams,
    options?: RequestOptions
  ): Promise<{ data: AssetCollection }> {
    return this.client.put<{ data: AssetCollection }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections/${collectionId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, collectionId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections/${collectionId}`,
      options?.headers
    )
  }

  /**
   * Lists the assets in a collection. Smart collections resolve their members
   * from the stored rules; manual collections are ordered by position unless
   * `params.sort` says otherwise.
   */
  async listAssets(
    spaceId: string,
    collectionId: string,
    params?: GetAssetsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Asset>> {
    return this.client.get<PaginatedResponse<Asset>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections/${collectionId}/assets`,
      params,
      options?.headers
    )
  }

  /** Appends assets to a manual collection. Already-present assets are skipped. */
  async addAssets(
    spaceId: string,
    collectionId: string,
    assetIds: string[],
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections/${collectionId}/assets`,
      { asset_ids: assetIds },
      options?.headers
    )
  }

  /** Removes assets from a manual collection. Non-members are ignored. */
  async removeAssets(
    spaceId: string,
    collectionId: string,
    assetIds: string[],
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections/${collectionId}/assets`,
      options?.headers,
      { asset_ids: assetIds }
    )
  }

  /**
   * Reorders a manual collection. `assetIds` is the full ordered list — its
   * index becomes each asset's new position; ids left out keep their position.
   */
  async reorderAssets(
    spaceId: string,
    collectionId: string,
    assetIds: string[],
    options?: RequestOptions
  ): Promise<void> {
    return this.client.patch<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-collections/${collectionId}/assets/order`,
      { asset_ids: assetIds },
      options?.headers
    )
  }
}
