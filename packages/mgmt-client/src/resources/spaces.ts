import type { HttpClient } from '../http-client'
import type {
  CreateSpaceParams,
  PaginatedResponse,
  RequestOptions,
  Space,
  UpdateSpaceIconParams,
  UpdateSpaceParams,
} from '../types'

export class SpacesResource {
  constructor(private readonly client: HttpClient) {}

  async create(params: CreateSpaceParams, options?: RequestOptions): Promise<Space> {
    return this.client.post<Space>('/mgmt/v1/spaces', params, options?.headers)
  }

  async get(spaceId: string, options?: RequestOptions): Promise<Space> {
    return this.client.get<Space>(`/mgmt/v1/spaces/${spaceId}`, undefined, options?.headers)
  }

  async update(
    spaceId: string,
    params: UpdateSpaceParams,
    options?: RequestOptions
  ): Promise<Space> {
    return this.client.put<Space>(`/mgmt/v1/spaces/${spaceId}`, params, options?.headers)
  }

  async delete(spaceId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}`, options?.headers)
  }

  async updateIcon(
    spaceId: string,
    params: UpdateSpaceIconParams,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/spaces/${spaceId}/icon`, params, options?.headers)
  }

  async archive(spaceId: string, options?: RequestOptions): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/spaces/${spaceId}/archive`, undefined, options?.headers)
  }

  async getAiUsage(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(
      `/mgmt/v1/spaces/${spaceId}/ai-usage`,
      undefined,
      options?.headers
    )
  }

  async getStats(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(`/mgmt/v1/spaces/${spaceId}/stats`, undefined, options?.headers)
  }
}
