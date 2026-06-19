import type { HttpClient } from '../http-client'
import type {
  Block,
  BlockTemplate,
  BlockVersion,
  CreateBlockTemplateParams,
  GetBlocksParams,
  PaginatedResponse,
  RequestOptions,
  UpdateBlockTemplateParams,
  UpdateBlockVersionParams,
} from '../types'

export class BlocksResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    spaceId: string,
    params?: GetBlocksParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Block>> {
    return this.client.get<PaginatedResponse<Block>>(
      `/mgmt/v1/spaces/${spaceId}/blocks`,
      params,
      options?.headers
    )
  }

  async create(spaceId: string, payload: Partial<Block>, options?: RequestOptions): Promise<Block> {
    return this.client.post<Block>(`/mgmt/v1/spaces/${spaceId}/blocks`, payload, options?.headers)
  }

  async get(spaceId: string, blockId: string, options?: RequestOptions): Promise<Block> {
    return this.client.get<Block>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    blockId: string,
    payload: Partial<Block>,
    options?: RequestOptions
  ): Promise<Block> {
    return this.client.put<Block>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, blockId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}`,
      options?.headers
    )
  }

  // ─── Templates ─────────────────────────────────────────────────────────────

  async listTemplates(
    spaceId: string,
    blockId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<BlockTemplate>> {
    return this.client.get<PaginatedResponse<BlockTemplate>>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/templates`,
      undefined,
      options?.headers
    )
  }

  async createTemplate(
    spaceId: string,
    blockId: string,
    payload: CreateBlockTemplateParams,
    options?: RequestOptions
  ): Promise<BlockTemplate> {
    return this.client.post<BlockTemplate>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/templates`,
      payload,
      options?.headers
    )
  }

  async getTemplate(
    spaceId: string,
    blockId: string,
    templateId: string,
    options?: RequestOptions
  ): Promise<BlockTemplate> {
    return this.client.get<BlockTemplate>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/templates/${templateId}`,
      undefined,
      options?.headers
    )
  }

  async updateTemplate(
    spaceId: string,
    blockId: string,
    templateId: string,
    payload: UpdateBlockTemplateParams,
    options?: RequestOptions
  ): Promise<BlockTemplate> {
    return this.client.put<BlockTemplate>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/templates/${templateId}`,
      payload,
      options?.headers
    )
  }

  async deleteTemplate(
    spaceId: string,
    blockId: string,
    templateId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/templates/${templateId}`,
      options?.headers
    )
  }

  // ─── Versions ──────────────────────────────────────────────────────────────

  async listVersions(
    spaceId: string,
    blockId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<BlockVersion>> {
    return this.client.get<PaginatedResponse<BlockVersion>>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/versions`,
      undefined,
      options?.headers
    )
  }

  async getVersion(
    spaceId: string,
    blockId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<BlockVersion> {
    return this.client.get<BlockVersion>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/versions/${versionId}`,
      undefined,
      options?.headers
    )
  }

  async updateVersion(
    spaceId: string,
    blockId: string,
    versionId: string,
    payload: UpdateBlockVersionParams,
    options?: RequestOptions
  ): Promise<BlockVersion> {
    return this.client.patch<BlockVersion>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/versions/${versionId}`,
      payload,
      options?.headers
    )
  }

  async deleteVersion(
    spaceId: string,
    blockId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/versions/${versionId}`,
      options?.headers
    )
  }

  async restoreVersion(
    spaceId: string,
    blockId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<BlockVersion> {
    return this.client.post<BlockVersion>(
      `/mgmt/v1/spaces/${spaceId}/blocks/${blockId}/versions/${versionId}/restore`,
      undefined,
      options?.headers
    )
  }
}
