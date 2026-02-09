import type { HttpClient } from '../http-client'
import type {
  Content,
  ContentVersion,
  GetContentsParams,
  PaginatedResponse,
  RequestOptions,
} from '../types'

export class ContentsResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetContentsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Content>> {
    return this.client.get<PaginatedResponse<Content>>(
      `/mgmt/v1/spaces/${spaceId}/contents`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: Partial<Content>,
    options?: RequestOptions
  ): Promise<Content> {
    return this.client.post<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, contentId: string, options?: RequestOptions): Promise<Content> {
    return this.client.get<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    contentId: string,
    payload: Partial<Content>,
    options?: RequestOptions
  ): Promise<Content> {
    return this.client.put<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, contentId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}`,
      options?.headers
    )
  }

  async publish(spaceId: string, contentId: string, options?: RequestOptions): Promise<Content> {
    return this.client.post<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/publish`,
      undefined,
      options?.headers
    )
  }

  async unpublish(spaceId: string, contentId: string, options?: RequestOptions): Promise<Content> {
    return this.client.post<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/unpublish`,
      undefined,
      options?.headers
    )
  }

  async getVersion(
    spaceId: string,
    contentId: string,
    version: number,
    options?: RequestOptions
  ): Promise<ContentVersion> {
    return this.client.get<ContentVersion>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}`,
      undefined,
      options?.headers
    )
  }

  async updateVersion(
    spaceId: string,
    contentId: string,
    version: number,
    payload: Partial<ContentVersion>,
    options?: RequestOptions
  ): Promise<ContentVersion> {
    return this.client.patch<ContentVersion>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}`,
      payload,
      options?.headers
    )
  }

  async publishVersion(
    spaceId: string,
    contentId: string,
    version: number,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}/publish`,
      undefined,
      options?.headers
    )
  }

  async setVersionAsCurrent(
    spaceId: string,
    contentId: string,
    version: number,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}/current`,
      undefined,
      options?.headers
    )
  }
}
