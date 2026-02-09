import type { HttpClient } from '../http-client'
import type { CreateSpaceTokenParams, RequestOptions, SpaceToken } from '../types'

export class TokensResource {
  constructor(private readonly client: HttpClient) {}

  async create(
    spaceId: string,
    params: CreateSpaceTokenParams,
    options?: RequestOptions
  ): Promise<SpaceToken> {
    return this.client.post<SpaceToken>(
      `/mgmt/v1/spaces/${spaceId}/tokens`,
      params,
      options?.headers
    )
  }

  async delete(spaceId: string, tokenId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/tokens/${tokenId}`,
      options?.headers
    )
  }
}
