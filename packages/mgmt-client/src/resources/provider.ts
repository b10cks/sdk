import type { HttpClient } from '../http-client'
import type {
  CreateProviderNoteParams,
  PaginatedResponse,
  ProviderNote,
  RequestOptions,
  UpdateProviderNoteParams,
} from '../types'

export class ProviderResource {
  constructor(private readonly client: HttpClient) {}

  async getStats(options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/provider/stats', undefined, options?.headers)
  }

  async listNotes(options?: RequestOptions): Promise<PaginatedResponse<ProviderNote>> {
    return this.client.get<PaginatedResponse<ProviderNote>>(
      '/mgmt/v1/provider/notes',
      undefined,
      options?.headers
    )
  }

  async createNote(
    payload: CreateProviderNoteParams,
    options?: RequestOptions
  ): Promise<{ data: ProviderNote }> {
    return this.client.post<{ data: ProviderNote }>(
      '/mgmt/v1/provider/notes',
      payload,
      options?.headers
    )
  }

  async getNote(noteId: string, options?: RequestOptions): Promise<{ data: ProviderNote }> {
    return this.client.get<{ data: ProviderNote }>(
      `/mgmt/v1/provider/notes/${noteId}`,
      undefined,
      options?.headers
    )
  }

  async updateNote(
    noteId: string,
    payload: UpdateProviderNoteParams,
    options?: RequestOptions
  ): Promise<{ data: ProviderNote }> {
    return this.client.patch<{ data: ProviderNote }>(
      `/mgmt/v1/provider/notes/${noteId}`,
      payload,
      options?.headers
    )
  }

  async deleteNote(noteId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/provider/notes/${noteId}`, options?.headers)
  }
}
