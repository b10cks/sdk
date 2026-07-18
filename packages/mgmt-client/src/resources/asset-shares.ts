import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  AssetShare,
  CreateAssetShareParams,
  GetAssetSharesParams,
  PaginatedResponse,
  RequestOptions,
  UpdateAssetShareParams,
} from '../types'

export class AssetSharesResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetAssetSharesParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AssetShare>> {
    return this.client.get<PaginatedResponse<AssetShare>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-shares`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: CreateAssetShareParams,
    options?: RequestOptions
  ): Promise<{ data: AssetShare }> {
    return this.client.post<{ data: AssetShare }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-shares`,
      payload,
      options?.headers
    )
  }

  async get(
    spaceId: string,
    shareId: string,
    options?: RequestOptions
  ): Promise<{ data: AssetShare }> {
    return this.client.get<{ data: AssetShare }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-shares/${shareId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    shareId: string,
    payload: UpdateAssetShareParams,
    options?: RequestOptions
  ): Promise<{ data: AssetShare }> {
    return this.client.put<{ data: AssetShare }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-shares/${shareId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, shareId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-shares/${shareId}`,
      options?.headers
    )
  }

  /** Revokes a share, blocking further public access. Idempotent. */
  async revoke(
    spaceId: string,
    shareId: string,
    options?: RequestOptions
  ): Promise<{ data: AssetShare }> {
    return this.client.post<{ data: AssetShare }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/asset-shares/${shareId}/revoke`,
      undefined,
      options?.headers
    )
  }
}
