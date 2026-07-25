import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type { BlockFolder, PaginatedResponse, PaginationParams, RequestOptions } from '../types'

export class BlockFoldersResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<BlockFolder>> {
    return this.client.get<PaginatedResponse<BlockFolder>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-folders`,
      params,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: Partial<BlockFolder>,
    options?: RequestOptions
  ): Promise<BlockFolder> {
    return this.client.post<BlockFolder>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-folders`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, folderId: string, options?: RequestOptions): Promise<BlockFolder> {
    return this.client.get<BlockFolder>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-folders/${folderId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    folderId: string,
    payload: Partial<BlockFolder>,
    options?: RequestOptions
  ): Promise<BlockFolder> {
    return this.client.put<BlockFolder>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-folders/${folderId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, folderId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/block-folders/${folderId}`,
      options?.headers
    )
  }
}
