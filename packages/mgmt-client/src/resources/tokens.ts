import type { HttpClient } from '../http-client'
import type { CreateSpaceTokenParams, SpaceToken } from '../types'

export class TokensResource {
  constructor(private readonly client: HttpClient) {}

  async create(spaceId: string, params: CreateSpaceTokenParams): Promise<SpaceToken> {
    return this.client.post<SpaceToken>(`/mgmt/v1/spaces/${spaceId}/tokens`, params)
  }

  async delete(spaceId: string, tokenId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/tokens/${tokenId}`)
  }
}
