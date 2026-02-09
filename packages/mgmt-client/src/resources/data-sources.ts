import type { HttpClient } from '../http-client'
import type { DataEntry, DataSource, PaginatedResponse, RequestOptions } from '../types'

export class DataSourcesResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string, options?: RequestOptions): Promise<PaginatedResponse<DataSource>> {
    return this.client.get<PaginatedResponse<DataSource>>(
      `/mgmt/v1/spaces/${spaceId}/data-sources`,
      undefined,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: Partial<DataSource>,
    options?: RequestOptions
  ): Promise<DataSource> {
    return this.client.post<DataSource>(
      `/mgmt/v1/spaces/${spaceId}/data-sources`,
      payload,
      options?.headers
    )
  }

  async get(spaceId: string, dataSourceId: string, options?: RequestOptions): Promise<DataSource> {
    return this.client.get<DataSource>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    dataSourceId: string,
    payload: Partial<DataSource>,
    options?: RequestOptions
  ): Promise<DataSource> {
    return this.client.put<DataSource>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, dataSourceId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}`,
      options?.headers
    )
  }

  async listEntries(
    spaceId: string,
    dataSourceId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<DataEntry>> {
    return this.client.get<PaginatedResponse<DataEntry>>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries`,
      undefined,
      options?.headers
    )
  }

  async createEntry(
    spaceId: string,
    dataSourceId: string,
    payload: Partial<DataEntry>,
    options?: RequestOptions
  ): Promise<DataEntry> {
    return this.client.post<DataEntry>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries`,
      payload,
      options?.headers
    )
  }

  async getEntry(
    spaceId: string,
    dataSourceId: string,
    entryId: string,
    options?: RequestOptions
  ): Promise<DataEntry> {
    return this.client.get<DataEntry>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries/${entryId}`,
      undefined,
      options?.headers
    )
  }

  async updateEntry(
    spaceId: string,
    dataSourceId: string,
    entryId: string,
    payload: Partial<DataEntry>,
    options?: RequestOptions
  ): Promise<DataEntry> {
    return this.client.put<DataEntry>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries/${entryId}`,
      payload,
      options?.headers
    )
  }

  async deleteEntry(
    spaceId: string,
    dataSourceId: string,
    entryId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries/${entryId}`,
      options?.headers
    )
  }
}
