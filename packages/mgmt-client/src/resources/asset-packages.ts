import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  AssetDownloadUrl,
  AssetPackage,
  CreateAssetPackageParams,
  PaginatedResponse,
  PaginationParams,
  RequestOptions,
} from '../types'

export class AssetPackagesResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AssetPackage>> {
    return this.client.get<PaginatedResponse<AssetPackage>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-packages`,
      params,
      options?.headers
    )
  }

  /**
   * Queues a package build. The response comes back immediately with
   * `state: 'pending'` — poll `get()` until the state reaches `completed`.
   */
  async create(
    spaceId: string,
    payload: CreateAssetPackageParams,
    options?: RequestOptions
  ): Promise<{ data: AssetPackage }> {
    return this.client.post<{ data: AssetPackage }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-packages`,
      payload,
      options?.headers
    )
  }

  async get(
    spaceId: string,
    packageId: string,
    options?: RequestOptions
  ): Promise<{ data: AssetPackage }> {
    return this.client.get<{ data: AssetPackage }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-packages/${packageId}`,
      undefined,
      options?.headers
    )
  }

  async delete(spaceId: string, packageId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-packages/${packageId}`,
      options?.headers
    )
  }

  /**
   * Resolves a presigned URL for the built archive. Throws a 409
   * `ManagementApiError` while the package is still building.
   */
  async download(
    spaceId: string,
    packageId: string,
    options?: RequestOptions
  ): Promise<AssetDownloadUrl> {
    return this.client.get<AssetDownloadUrl>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-packages/${packageId}/download`,
      undefined,
      options?.headers
    )
  }
}
