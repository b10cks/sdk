import type { HttpClient } from '../http-client'
import type { CreateIconParams, GetIconsParams, Icon, PaginatedResponse, RequestOptions, UpdateIconParams } from '../types'

export class IconsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, params?: GetIconsParams, options?: RequestOptions): Promise<PaginatedResponse<Icon>> {
    return this.client.get<PaginatedResponse<Icon>>(
      `/mgmt/v1/spaces/${spaceId}/icons`,
      params as Record<string, unknown>,
      options?.headers
    )
  }

  async get(spaceId: string, iconId: string, options?: RequestOptions): Promise<Icon> {
    return this.client.get<Icon>(
      `/mgmt/v1/spaces/${spaceId}/icons/${iconId}`,
      undefined,
      options?.headers
    )
  }

  async create(spaceId: string, payload: CreateIconParams, options?: RequestOptions): Promise<Icon> {
    return this.client.post<Icon>(
      `/mgmt/v1/spaces/${spaceId}/icons`,
      payload,
      options?.headers
    )
  }

  async update(spaceId: string, iconId: string, payload: UpdateIconParams, options?: RequestOptions): Promise<Icon> {
    return this.client.put<Icon>(
      `/mgmt/v1/spaces/${spaceId}/icons/${iconId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, iconId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/icons/${iconId}`,
      options?.headers
    )
  }

  async tags(spaceId: string, options?: RequestOptions): Promise<{ data: string[] }> {
    return this.client.get<{ data: string[] }>(
      `/mgmt/v1/spaces/${spaceId}/icons/tags`,
      undefined,
      options?.headers
    )
  }
}
