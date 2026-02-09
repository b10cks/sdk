import type { HttpClient } from '../http-client'
import type { GetRedirectsParams, PaginatedResponse, Redirect, RequestOptions } from '../types'

export class RedirectsResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetRedirectsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Redirect>> {
    return this.client.get<PaginatedResponse<Redirect>>(
      `/mgmt/v1/spaces/${spaceId}/redirects`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: Partial<Redirect>,
    options?: RequestOptions
  ): Promise<Redirect> {
    return this.client.post<Redirect>(
      `/mgmt/v1/spaces/${spaceId}/redirects`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, redirectId: string, options?: RequestOptions): Promise<Redirect> {
    return this.client.get<Redirect>(
      `/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    redirectId: string,
    payload: Partial<Redirect>,
    options?: RequestOptions
  ): Promise<Redirect> {
    return this.client.put<Redirect>(
      `/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, redirectId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}`,
      options?.headers
    )
  }

  async reset(spaceId: string, redirectId: string, options?: RequestOptions): Promise<Redirect> {
    return this.client.post<Redirect>(
      `/mgmt/v1/spaces/${spaceId}/redirects/${redirectId}/reset`,
      undefined,
      options?.headers
    )
  }
}
