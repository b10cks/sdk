import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  Asset,
  AssetVersion,
  GetAssetsParams,
  LinkedAssetContent,
  PaginatedResponse,
  PaginationParams,
  ReplaceAssetFileParams,
  RequestOptions,
} from '../types'

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

  /**
   * Replaces an asset's file, keeping its id and references intact. The
   * previous file is snapshotted as a version first.
   */
  async replaceFile(
    spaceId: string,
    assetId: string,
    payload: ReplaceAssetFileParams,
    options?: RequestOptions
  ): Promise<Asset> {
    return this.client.post<Asset>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/${assetId}/replace-file`,
      payload,
      options?.headers
    )
  }

  /** Lists an asset's file versions, most recent first. */
  async listVersions(
    spaceId: string,
    assetId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AssetVersion>> {
    return this.client.get<PaginatedResponse<AssetVersion>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/${assetId}/versions`,
      params,
      options?.headers
    )
  }

  /**
   * Restores an asset to an earlier version. Non-destructive — the current
   * file is snapshotted before being replaced.
   */
  async restoreVersion(
    spaceId: string,
    assetId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<Asset> {
    return this.client.post<Asset>(
      apiPath`/mgmt/v1/spaces/${spaceId}/assets/${assetId}/versions/${versionId}/restore`,
      undefined,
      options?.headers
    )
  }
}
