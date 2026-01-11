import type { HttpClient } from '../http-client'
import type { CreateTeamParams, PaginatedResponse, Team, TeamHierarchy, UpdateTeamParams } from '../types'

export class TeamsResource {
  constructor(private readonly client: HttpClient) {}

  async list(): Promise<PaginatedResponse<Team>> {
    return this.client.get<PaginatedResponse<Team>>('/mgmt/v1/teams')
  }

  async create(params: CreateTeamParams): Promise<Team> {
    return this.client.post<Team>('/mgmt/v1/teams', params)
  }

  async get(teamId: string): Promise<Team> {
    return this.client.get<Team>(`/mgmt/v1/teams/${teamId}`)
  }

  async update(teamId: string, params: UpdateTeamParams): Promise<Team> {
    return this.client.put<Team>(`/mgmt/v1/teams/${teamId}`, params)
  }

  async delete(teamId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/teams/${teamId}`)
  }

  async getHierarchy(): Promise<TeamHierarchy> {
    return this.client.get<TeamHierarchy>('/mgmt/v1/teams/hierarchy')
  }

  async addUser(teamId: string): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/teams/${teamId}/users`)
  }

  async updateUser(teamId: string, userId: string): Promise<void> {
    return this.client.patch<void>(`/mgmt/v1/teams/${teamId}/users/${userId}`)
  }

  async removeUser(teamId: string, userId: string): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/teams/${teamId}/users/${userId}`)
  }
}
