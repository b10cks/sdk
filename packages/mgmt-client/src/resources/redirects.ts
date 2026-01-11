import type { HttpClient } from '../http-client'
import type { GetRedirectsParams, PaginatedResponse, Redirect } from '../types'

export class RedirectsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, params?: GetRedirectsParams): Promise<PaginatedResponse<Redirect>> {
    return this.client.get<PaginatedResponse<Redirect>>(`/mgmt/v1/spaces/${spaceId}/redirects`, params)
  }

  async create(spaceId: string): Promise<Redirect> {
    return this.client.post<Redirect>(`/mgmt/v1/spaces/${spaceId}/redirects`)
  }

  async get(spaceId: string, redirectId: string): Promise<Redirect> {
    return this.client.get<Redirect>(`/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}`)
  }

  async update(spaceId: string, redirectId: string): Promise<Redirect> {
    return this.client.put<Redirect>(`/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}`)
  }

  async delete(spaceId: string, redirectId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}`)
  }

  async reset(spaceId: string, redirectId: string): Promise<Redirect> {
    return this.client.post<Redirect>(`/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}/reset`)
  }
}
