import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type { CreateSpaceTokenParams, PaginatedResponse, PaginationParams, RequestOptions, SpaceToken } from '../types'

export class TokensResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<SpaceToken>> {
    return this.client.get<PaginatedResponse<SpaceToken>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/tokens`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    params: CreateSpaceTokenParams,
    options?: RequestOptions
  ): Promise<SpaceToken> {
    return this.client.post<SpaceToken>(
      apiPath`/mgmt/v1/spaces/${spaceId}/tokens`,
      params,
      options?.headers
    )
  }

  async delete(spaceId: string, tokenId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/tokens/${tokenId}`,
      options?.headers
    )
  }
}
