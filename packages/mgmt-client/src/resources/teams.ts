import type { HttpClient } from '../http-client'
import type {
  CreateTeamParams,
  PaginatedResponse,
  RequestOptions,
  Team,
  TeamHierarchy,
  UpdateTeamParams,
} from '../types'

export class TeamsResource {
  constructor(private readonly client: HttpClient) {}

  async list(options?: RequestOptions): Promise<PaginatedResponse<Team>> {
    return this.client.get<PaginatedResponse<Team>>('/mgmt/v1/teams', undefined, options?.headers)
  }

  async create(params: CreateTeamParams, options?: RequestOptions): Promise<Team> {
    return this.client.post<Team>('/mgmt/v1/teams', params, options?.headers)
  }

  async get(teamId: string, options?: RequestOptions): Promise<Team> {
    return this.client.get<Team>(`/mgmt/v1/teams/${teamId}`, undefined, options?.headers)
  }

  async update(teamId: string, params: UpdateTeamParams, options?: RequestOptions): Promise<Team> {
    return this.client.put<Team>(`/mgmt/v1/teams/${teamId}`, params, options?.headers)
  }

  async delete(teamId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/teams/${teamId}`, options?.headers)
  }

  async getHierarchy(options?: RequestOptions): Promise<TeamHierarchy> {
    return this.client.get<TeamHierarchy>('/mgmt/v1/teams/hierarchy', undefined, options?.headers)
  }

  async addUser(
    teamId: string,
    payload: { user_id: string; role?: string },
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/teams/${teamId}/users`, payload, options?.headers)
  }

  async updateUser(
    teamId: string,
    userId: string,
    payload: { role: string },
    options?: RequestOptions
  ): Promise<void> {
    return this.client.patch<void>(
      `/mgmt/v1/teams/${teamId}/users/${userId}`,
      payload,
      options?.headers
    )
  }

  async removeUser(teamId: string, userId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/teams/${teamId}/users/${userId}`, options?.headers)
  }
}
