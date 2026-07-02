import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  CreateInviteParams,
  CreateRoleParams,
  CreateSpaceBlueprintParams,
  CreateTeamParams,
  Invite,
  PaginatedResponse,
  RequestOptions,
  Role,
  SpaceBlueprint,
  Team,
  TeamHierarchy,
  TeamMember,
  TeamSamlProvider,
  UpdateRoleParams,
  UpdateSpaceBlueprintParams,
  UpdateTeamParams,
  UpsertTeamSamlProviderParams,
} from '../types'

export class TeamsResource {
  constructor(private readonly client: HttpClient) {}

  async list(options?: RequestOptions): Promise<PaginatedResponse<Team>> {
    return this.client.get<PaginatedResponse<Team>>('/mgmt/v1/teams', options?.query, options?.headers)
  }

  async create(params: CreateTeamParams, options?: RequestOptions): Promise<Team> {
    return this.client.post<Team>('/mgmt/v1/teams', params, options?.headers)
  }

  async get(teamId: string, options?: RequestOptions): Promise<Team> {
    return this.client.get<Team>(apiPath`/mgmt/v1/teams/${teamId}`, undefined, options?.headers)
  }

  async update(teamId: string, params: UpdateTeamParams, options?: RequestOptions): Promise<Team> {
    return this.client.put<Team>(apiPath`/mgmt/v1/teams/${teamId}`, params, options?.headers)
  }

  async delete(teamId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(apiPath`/mgmt/v1/teams/${teamId}`, options?.headers)
  }

  async getHierarchy(options?: RequestOptions): Promise<TeamHierarchy> {
    return this.client.get<TeamHierarchy>('/mgmt/v1/teams/hierarchy', undefined, options?.headers)
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async listMembers(
    teamId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<TeamMember>> {
    return this.client.get<PaginatedResponse<TeamMember>>(
      apiPath`/mgmt/v1/teams/${teamId}/members`,
      undefined,
      options?.headers
    )
  }

  async updateMember(
    teamId: string,
    userId: string,
    payload: { role: string },
    options?: RequestOptions
  ): Promise<TeamMember> {
    return this.client.patch<TeamMember>(
      apiPath`/mgmt/v1/teams/${teamId}/members/${userId}`,
      payload,
      options?.headers
    )
  }

  async removeMember(teamId: string, userId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(apiPath`/mgmt/v1/teams/${teamId}/members/${userId}`, options?.headers)
  }

  // ─── Users (direct team membership management) ─────────────────────────────

  async addUser(
    teamId: string,
    payload: { user_id: string; role?: string },
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(apiPath`/mgmt/v1/teams/${teamId}/users`, payload, options?.headers)
  }

  async updateUser(
    teamId: string,
    userId: string,
    payload: { role: string },
    options?: RequestOptions
  ): Promise<void> {
    return this.client.patch<void>(
      apiPath`/mgmt/v1/teams/${teamId}/users/${userId}`,
      payload,
      options?.headers
    )
  }

  async removeUser(teamId: string, userId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(apiPath`/mgmt/v1/teams/${teamId}/users/${userId}`, options?.headers)
  }

  // ─── Invites ───────────────────────────────────────────────────────────────

  async listInvites(teamId: string, options?: RequestOptions): Promise<PaginatedResponse<Invite>> {
    return this.client.get<PaginatedResponse<Invite>>(
      apiPath`/mgmt/v1/teams/${teamId}/invites`,
      undefined,
      options?.headers
    )
  }

  async createInvite(
    teamId: string,
    payload: CreateInviteParams,
    options?: RequestOptions
  ): Promise<Invite> {
    return this.client.post<Invite>(
      apiPath`/mgmt/v1/teams/${teamId}/invites`,
      payload,
      options?.headers
    )
  }

  async deleteInvite(teamId: string, inviteId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/teams/${teamId}/invites/${inviteId}`,
      options?.headers
    )
  }

  async resendInvite(teamId: string, inviteId: string, options?: RequestOptions): Promise<void> {
    return this.client.post<void>(
      apiPath`/mgmt/v1/teams/${teamId}/invites/${inviteId}/resend`,
      undefined,
      options?.headers
    )
  }

  // ─── SAML Provider ─────────────────────────────────────────────────────────

  async getSamlProvider(
    teamId: string,
    options?: RequestOptions
  ): Promise<{ data: TeamSamlProvider }> {
    return this.client.get<{ data: TeamSamlProvider }>(
      apiPath`/mgmt/v1/teams/${teamId}/saml-provider`,
      undefined,
      options?.headers
    )
  }

  async upsertSamlProvider(
    teamId: string,
    payload: UpsertTeamSamlProviderParams,
    options?: RequestOptions
  ): Promise<{ data: TeamSamlProvider }> {
    return this.client.put<{ data: TeamSamlProvider }>(
      apiPath`/mgmt/v1/teams/${teamId}/saml-provider`,
      payload,
      options?.headers
    )
  }

  async deleteSamlProvider(teamId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(apiPath`/mgmt/v1/teams/${teamId}/saml-provider`, options?.headers)
  }

  // ─── Space Blueprints ──────────────────────────────────────────────────────

  async listBlueprints(
    teamId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<SpaceBlueprint>> {
    return this.client.get<PaginatedResponse<SpaceBlueprint>>(
      apiPath`/mgmt/v1/teams/${teamId}/blueprints`,
      undefined,
      options?.headers
    )
  }

  async createBlueprint(
    teamId: string,
    payload: CreateSpaceBlueprintParams,
    options?: RequestOptions
  ): Promise<{ data: SpaceBlueprint }> {
    return this.client.post<{ data: SpaceBlueprint }>(
      apiPath`/mgmt/v1/teams/${teamId}/blueprints`,
      payload,
      options?.headers
    )
  }

  async getBlueprint(
    teamId: string,
    blueprintId: string,
    options?: RequestOptions
  ): Promise<{ data: SpaceBlueprint }> {
    return this.client.get<{ data: SpaceBlueprint }>(
      apiPath`/mgmt/v1/teams/${teamId}/blueprints/${blueprintId}`,
      undefined,
      options?.headers
    )
  }

  async updateBlueprint(
    teamId: string,
    blueprintId: string,
    payload: UpdateSpaceBlueprintParams,
    options?: RequestOptions
  ): Promise<{ data: SpaceBlueprint }> {
    return this.client.put<{ data: SpaceBlueprint }>(
      apiPath`/mgmt/v1/teams/${teamId}/blueprints/${blueprintId}`,
      payload,
      options?.headers
    )
  }

  async deleteBlueprint(
    teamId: string,
    blueprintId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/teams/${teamId}/blueprints/${blueprintId}`,
      options?.headers
    )
  }

  // ─── Space Roles ───────────────────────────────────────────────────────────

  async listSpaceRoles(teamId: string, options?: RequestOptions): Promise<{ data: Role[] }> {
    return this.client.get<{ data: Role[] }>(
      apiPath`/mgmt/v1/teams/${teamId}/roles/space`,
      undefined,
      options?.headers
    )
  }

  async createSpaceRole(
    teamId: string,
    payload: CreateRoleParams,
    options?: RequestOptions
  ): Promise<{ data: Role }> {
    return this.client.post<{ data: Role }>(
      apiPath`/mgmt/v1/teams/${teamId}/roles/space`,
      payload,
      options?.headers
    )
  }

  async updateSpaceRole(
    teamId: string,
    roleId: string,
    payload: UpdateRoleParams,
    options?: RequestOptions
  ): Promise<{ data: Role }> {
    return this.client.patch<{ data: Role }>(
      apiPath`/mgmt/v1/teams/${teamId}/roles/space/${roleId}`,
      payload,
      options?.headers
    )
  }

  async deleteSpaceRole(teamId: string, roleId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/teams/${teamId}/roles/space/${roleId}`,
      options?.headers
    )
  }
}
