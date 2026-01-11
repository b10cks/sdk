import type { HttpClient } from '../http-client'
import type { DataEntry, DataSource, PaginatedResponse } from '../types'

export class DataSourcesResource {
  constructor(private readonly client: HttpClient) {}

  async list(spaceId: string): Promise<PaginatedResponse<DataSource>> {
    return this.client.get<PaginatedResponse<DataSource>>(`/mgmt/v1/spaces/${spaceId}/data-sources`)
  }

  async create(spaceId: string): Promise<DataSource> {
    return this.client.post<DataSource>(`/mgmt/v1/spaces/${spaceId}/data-sources`)
  }

  async get(spaceId: string, dataSourceId: string): Promise<DataSource> {
    return this.client.get<DataSource>(`/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}`)
  }

  async update(spaceId: string, dataSourceId: string): Promise<DataSource> {
    return this.client.put<DataSource>(`/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}`)
  }

  async delete(spaceId: string, dataSourceId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}`)
  }

  async listEntries(spaceId: string, dataSourceId: string): Promise<PaginatedResponse<DataEntry>> {
    return this.client.get<PaginatedResponse<DataEntry>>(
      `/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries`
    )
  }

  async createEntry(spaceId: string, dataSourceId: string): Promise<DataEntry> {
    return this.client.post<DataEntry>(`/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries`)
  }

  async getEntry(spaceId: string, dataSourceId: string, entryId: string): Promise<DataEntry> {
    return this.client.get<DataEntry>(`/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries/${entryId}`)
  }

  async updateEntry(spaceId: string, dataSourceId: string, entryId: string): Promise<DataEntry> {
    return this.client.put<DataEntry>(`/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries/${entryId}`)
  }

  async deleteEntry(spaceId: string, dataSourceId: string, entryId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/data-sources/${dataSourceId}/entries/${entryId}`)
  }
}
