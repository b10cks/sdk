import type { HttpClient } from '../http-client'
import type {
  Content,
  ContentTreeOperationsParams,
  ContentTreeOperationsResult,
  ContentVersion,
  ContentVersionListItem,
  CreateContentParams,
  GetContentsParams,
  MoveContentParams,
  PaginatedResponse,
  PublishContentParams,
  RequestOptions,
  ScheduleContentParams,
  UpdateContentParams,
} from '../types'

const isRequestOptions = (
  value: PublishContentParams | RequestOptions | undefined
): value is RequestOptions => {
  if (!value || typeof value !== 'object') return false

  return Object.keys(value).every((key) => key === 'headers')
}

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
    payload: CreateContentParams,
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
    payload: UpdateContentParams,
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

  async bulkCreate(
    spaceId: string,
    payload: { items: CreateContentParams[] },
    options?: RequestOptions
  ): Promise<{ data: Content[] }> {
    return this.client.post<{ data: Content[] }>(
      `/mgmt/v1/spaces/${spaceId}/contents/bulk-create`,
      payload,
      options?.headers
    )
  }

  async treeOperations(
    spaceId: string,
    payload: ContentTreeOperationsParams,
    options?: RequestOptions
  ): Promise<ContentTreeOperationsResult> {
    return this.client.post<ContentTreeOperationsResult>(
      `/mgmt/v1/spaces/${spaceId}/contents/tree-operations`,
      payload,
      options?.headers
    )
  }

  async move(
    spaceId: string,
    contentId: string,
    payload: MoveContentParams,
    options?: RequestOptions
  ): Promise<Content> {
    return this.client.post<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/move`,
      payload,
      options?.headers
    )
  }

  async publish(spaceId: string, contentId: string, options?: RequestOptions): Promise<Content>
  async publish(
    spaceId: string,
    contentId: string,
    payload: PublishContentParams,
    options?: RequestOptions
  ): Promise<Content>
  async publish(
    spaceId: string,
    contentId: string,
    payloadOrOptions?: PublishContentParams | RequestOptions,
    options?: RequestOptions
  ): Promise<Content> {
    const payload = isRequestOptions(payloadOrOptions) ? undefined : payloadOrOptions
    const requestOptions = isRequestOptions(payloadOrOptions) ? payloadOrOptions : options

    return this.client.post<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/publish`,
      payload,
      requestOptions?.headers
    )
  }

  async unpublish(spaceId: string, contentId: string, options?: RequestOptions): Promise<Content> {
    return this.client.post<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/unpublish`,
      undefined,
      options?.headers
    )
  }

  async schedule(
    spaceId: string,
    contentId: string,
    payload: ScheduleContentParams,
    options?: RequestOptions
  ): Promise<Content> {
    return this.client.post<Content>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/schedule`,
      payload,
      options?.headers
    )
  }

  // ─── Versions ──────────────────────────────────────────────────────────────

  async listVersions(
    spaceId: string,
    contentId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<ContentVersionListItem>> {
    return this.client.get<PaginatedResponse<ContentVersionListItem>>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions`,
      undefined,
      options?.headers
    )
  }

  async getVersion(
    spaceId: string,
    contentId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<ContentVersion> {
    return this.client.get<ContentVersion>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${versionId}`,
      undefined,
      options?.headers
    )
  }

  async updateVersion(
    spaceId: string,
    contentId: string,
    versionId: string,
    payload: { message?: string },
    options?: RequestOptions
  ): Promise<ContentVersionListItem> {
    return this.client.patch<ContentVersionListItem>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${versionId}`,
      payload,
      options?.headers
    )
  }

  async publishVersion(
    spaceId: string,
    contentId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${versionId}/publish`,
      undefined,
      options?.headers
    )
  }

  async setVersionAsCurrent(
    spaceId: string,
    contentId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/versions/${versionId}/current`,
      undefined,
      options?.headers
    )
  }
}
