import type { HttpClient } from '../http-client'
import type { CreateSpaceParams, PaginatedResponse, Space, UpdateSpaceIconParams, UpdateSpaceParams } from '../types'

export class SpacesResource {
  constructor(private readonly client: HttpClient) {}

  async create(params: CreateSpaceParams): Promise<Space> {
    return this.client.post<Space>('/mgmt/v1/spaces', params)
  }

  async get(spaceId: string): Promise<Space> {
    return this.client.get<Space>(`/mgmt/v1/spaces/${spaceId}`)
  }

  async update(spaceId: string, params: UpdateSpaceParams): Promise<Space> {
    return this.client.put<Space>(`/mgmt/v1/spaces/${spaceId}`, params)
  }

  async delete(spaceId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}`)
  }

  async updateIcon(spaceId: string, params: UpdateSpaceIconParams): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/spaces/${spaceId}/icon`, params)
  }

  async archive(spaceId: string): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/spaces/${spaceId}/archive`)
  }

  async getAiUsage(spaceId: string): Promise<unknown> {
    return this.client.get<unknown>(`/mgmt/v1/spaces/${spaceId}/ai-usage`)
  }

  async getStats(spaceId: string): Promise<unknown> {
    return this.client.get<unknown>(`/mgmt/v1/spaces/${spaceId}/stats`)
  }
}
