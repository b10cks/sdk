import type { HttpClient } from '../http-client'
import type { Content, ContentVersion, GetContentsParams, PaginatedResponse } from '../types'

export class ContentsResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, params?: GetContentsParams): Promise<PaginatedResponse<Content>> {
    return this.client.get<PaginatedResponse<Content>>(`/mgmt/v1/spaces/${spaceId}/contents`, params)
  }

  async create(spaceId: string): Promise<Content> {
    return this.client.post<Content>(`/mgmt/v1/spaces/${spaceId}/contents`)
  }

  async get(spaceId: string, contentId: string): Promise<Content> {
    return this.client.get<Content>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}`)
  }

  async update(spaceId: string, contentId: string): Promise<Content> {
    return this.client.put<Content>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}`)
  }

  async delete(spaceId: string, contentId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}`)
  }

  async publish(spaceId: string, contentId: string): Promise<Content> {
    return this.client.post<Content>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}/publish`)
  }

  async unpublish(spaceId: string, contentId: string): Promise<Content> {
    return this.client.post<Content>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}/unpublish`)
  }

  async getVersion(spaceId: string, contentId: string, version: number): Promise<ContentVersion> {
    return this.client.get<ContentVersion>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}`)
  }

  async updateVersion(spaceId: string, contentId: string, version: number): Promise<ContentVersion> {
    return this.client.patch<ContentVersion>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}`)
  }

  async publishVersion(spaceId: string, contentId: string, version: number): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}/publish`)
  }

  async setVersionAsCurrent(spaceId: string, contentId: string, version: number): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${version}/current`)
  }
}
