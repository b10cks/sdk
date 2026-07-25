import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  AssignReleaseVersionParams,
  CreateReleaseParams,
  PaginatedResponse,
  PaginationParams,
  Release,
  RemoveReleaseVersionParams,
  RequestOptions,
  UpdateReleaseParams,
} from '../types'

export class ReleasesResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Release>> {
    return this.client.get<PaginatedResponse<Release>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: CreateReleaseParams,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.post<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases`,
      payload,
      options?.headers
    )
  }

  async get(
    spaceId: string,
    releaseId: string,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.get<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    releaseId: string,
    payload: UpdateReleaseParams,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.put<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, releaseId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}`,
      options?.headers
    )
  }

  async commit(
    spaceId: string,
    releaseId: string,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.post<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}/commit`,
      undefined,
      options?.headers
    )
  }

  async cancel(
    spaceId: string,
    releaseId: string,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.post<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}/cancel`,
      undefined,
      options?.headers
    )
  }

  async publish(
    spaceId: string,
    releaseId: string,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.post<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}/publish`,
      undefined,
      options?.headers
    )
  }

  async assignVersion(
    spaceId: string,
    releaseId: string,
    payload: AssignReleaseVersionParams,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.post<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}/versions/assign`,
      payload,
      options?.headers
    )
  }

  async removeVersion(
    spaceId: string,
    releaseId: string,
    payload: RemoveReleaseVersionParams,
    options?: RequestOptions
  ): Promise<{ data: Release }> {
    return this.client.delete<{ data: Release }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/releases/${releaseId}/versions/remove`,
      options?.headers,
      payload
    )
  }
}
