import type { HttpClient } from '../http-client'
import type {
  AuditLog,
  Backup,
  CheckoutSubscriptionParams,
  CreateBackupParams,
  CreateInviteParams,
  CreateMigrationParams,
  CreateSpaceAiConfigParams,
  CreateSpaceParams,
  GetAuditLogsParams,
  Invite,
  Migration,
  PaginatedResponse,
  RequestOptions,
  Role,
  Space,
  SpaceAiConfig,
  SpaceAiSettings,
  SpaceMember,
  Subscription,
  UpdateBackupParams,
  UpdateSpaceAiConfigParams,
  UpdateSpaceAiSettingsParams,
  UpdateSpaceIconParams,
  UpdateSpaceParams,
} from '../types'

export class SpacesResource {
  constructor(private readonly client: HttpClient) {}

  async list(options?: RequestOptions): Promise<PaginatedResponse<Space>> {
    return this.client.get<PaginatedResponse<Space>>('/mgmt/v1/spaces', undefined, options?.headers)
  }

  async create(params: CreateSpaceParams, options?: RequestOptions): Promise<Space> {
    return this.client.post<Space>('/mgmt/v1/spaces', params, options?.headers)
  }

  async get(spaceId: string, options?: RequestOptions): Promise<Space> {
    return this.client.get<Space>(`/mgmt/v1/spaces/${spaceId}`, undefined, options?.headers)
  }

  async update(
    spaceId: string,
    params: UpdateSpaceParams,
    options?: RequestOptions
  ): Promise<Space> {
    return this.client.put<Space>(`/mgmt/v1/spaces/${spaceId}`, params, options?.headers)
  }

  async delete(spaceId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}`, options?.headers)
  }

  async updateIcon(
    spaceId: string,
    params: UpdateSpaceIconParams,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(`/mgmt/v1/spaces/${spaceId}/icon`, params, options?.headers)
  }

  async archive(spaceId: string, options?: RequestOptions): Promise<void> {
    return this.client.post<void>(
      `/mgmt/v1/spaces/${spaceId}/archive`,
      undefined,
      options?.headers
    )
  }

  async getAiUsage(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(
      `/mgmt/v1/spaces/${spaceId}/ai-usage`,
      undefined,
      options?.headers
    )
  }

  async getStats(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(`/mgmt/v1/spaces/${spaceId}/stats`, undefined, options?.headers)
  }

  async getContentMenu(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(
      `/mgmt/v1/spaces/${spaceId}/content-menu`,
      undefined,
      options?.headers
    )
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async listMembers(
    spaceId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<SpaceMember>> {
    return this.client.get<PaginatedResponse<SpaceMember>>(
      `/mgmt/v1/spaces/${spaceId}/members`,
      undefined,
      options?.headers
    )
  }

  async updateMember(
    spaceId: string,
    userId: string,
    payload: { role: string },
    options?: RequestOptions
  ): Promise<SpaceMember> {
    return this.client.patch<SpaceMember>(
      `/mgmt/v1/spaces/${spaceId}/members/${userId}`,
      payload,
      options?.headers
    )
  }

  async removeMember(spaceId: string, userId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/members/${userId}`,
      options?.headers
    )
  }

  // ─── Invites ───────────────────────────────────────────────────────────────

  async listInvites(
    spaceId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Invite>> {
    return this.client.get<PaginatedResponse<Invite>>(
      `/mgmt/v1/spaces/${spaceId}/invites`,
      undefined,
      options?.headers
    )
  }

  async createInvite(
    spaceId: string,
    payload: CreateInviteParams,
    options?: RequestOptions
  ): Promise<Invite> {
    return this.client.post<Invite>(
      `/mgmt/v1/spaces/${spaceId}/invites`,
      payload,
      options?.headers
    )
  }

  async deleteInvite(spaceId: string, inviteId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/invites/${inviteId}`,
      options?.headers
    )
  }

  async resendInvite(spaceId: string, inviteId: string, options?: RequestOptions): Promise<void> {
    return this.client.post<void>(
      `/mgmt/v1/spaces/${spaceId}/invites/${inviteId}/resend`,
      undefined,
      options?.headers
    )
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  async updateSearch(
    spaceId: string,
    payload: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.patch<unknown>(
      `/mgmt/v1/spaces/${spaceId}/search`,
      payload,
      options?.headers
    )
  }

  async reindexSearch(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.post<unknown>(
      `/mgmt/v1/spaces/${spaceId}/search/reindex`,
      undefined,
      options?.headers
    )
  }

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  async listSubscriptions(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ data: Subscription[] }> {
    return this.client.get<{ data: Subscription[] }>(
      `/mgmt/v1/spaces/${spaceId}/subscriptions`,
      undefined,
      options?.headers
    )
  }

  async getCurrentSubscription(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ data: Subscription | null }> {
    return this.client.get<{ data: Subscription | null }>(
      `/mgmt/v1/spaces/${spaceId}/subscriptions/current`,
      undefined,
      options?.headers
    )
  }

  async checkoutSubscription(
    spaceId: string,
    payload: CheckoutSubscriptionParams,
    options?: RequestOptions
  ): Promise<{ checkout_url: string | null; upgraded?: boolean }> {
    return this.client.post<{ checkout_url: string | null; upgraded?: boolean }>(
      `/mgmt/v1/spaces/${spaceId}/subscriptions/checkout`,
      payload,
      options?.headers
    )
  }

  async reinitSubscription(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ checkout_url: string }> {
    return this.client.post<{ checkout_url: string }>(
      `/mgmt/v1/spaces/${spaceId}/subscriptions/reinit`,
      undefined,
      options?.headers
    )
  }

  async cancelSubscription(spaceId: string, options?: RequestOptions): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      `/mgmt/v1/spaces/${spaceId}/subscriptions/cancel`,
      undefined,
      options?.headers
    )
  }

  // ─── AI Settings ───────────────────────────────────────────────────────────

  async getAiSettings(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ data: SpaceAiSettings }> {
    return this.client.get<{ data: SpaceAiSettings }>(
      `/mgmt/v1/spaces/${spaceId}/ai-settings`,
      undefined,
      options?.headers
    )
  }

  async updateAiSettings(
    spaceId: string,
    payload: UpdateSpaceAiSettingsParams,
    options?: RequestOptions
  ): Promise<{ data: SpaceAiSettings }> {
    return this.client.patch<{ data: SpaceAiSettings }>(
      `/mgmt/v1/spaces/${spaceId}/ai-settings`,
      payload,
      options?.headers
    )
  }

  // ─── AI Configs ────────────────────────────────────────────────────────────

  async listAiConfigs(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ data: SpaceAiConfig[] }> {
    return this.client.get<{ data: SpaceAiConfig[] }>(
      `/mgmt/v1/spaces/${spaceId}/ai-configs`,
      undefined,
      options?.headers
    )
  }

  async createAiConfig(
    spaceId: string,
    payload: CreateSpaceAiConfigParams,
    options?: RequestOptions
  ): Promise<{ data: SpaceAiConfig }> {
    return this.client.post<{ data: SpaceAiConfig }>(
      `/mgmt/v1/spaces/${spaceId}/ai-configs`,
      payload,
      options?.headers
    )
  }

  async getAiConfig(
    spaceId: string,
    configId: string,
    options?: RequestOptions
  ): Promise<{ data: SpaceAiConfig }> {
    return this.client.get<{ data: SpaceAiConfig }>(
      `/mgmt/v1/spaces/${spaceId}/ai-configs/${configId}`,
      undefined,
      options?.headers
    )
  }

  async updateAiConfig(
    spaceId: string,
    configId: string,
    payload: UpdateSpaceAiConfigParams,
    options?: RequestOptions
  ): Promise<{ data: SpaceAiConfig }> {
    return this.client.patch<{ data: SpaceAiConfig }>(
      `/mgmt/v1/spaces/${spaceId}/ai-configs/${configId}`,
      payload,
      options?.headers
    )
  }

  async deleteAiConfig(spaceId: string, configId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/ai-configs/${configId}`,
      options?.headers
    )
  }

  // ─── Audit Logs ────────────────────────────────────────────────────────────

  async getAuditLogs(
    spaceId: string,
    params?: GetAuditLogsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AuditLog>> {
    return this.client.get<PaginatedResponse<AuditLog>>(
      `/mgmt/v1/spaces/${spaceId}/audit-logs`,
      params,
      options?.headers
    )
  }

  // ─── Backups ───────────────────────────────────────────────────────────────

  async listBackups(
    spaceId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Backup>> {
    return this.client.get<PaginatedResponse<Backup>>(
      `/mgmt/v1/spaces/${spaceId}/backups`,
      undefined,
      options?.headers
    )
  }

  async createBackup(
    spaceId: string,
    payload: CreateBackupParams,
    options?: RequestOptions
  ): Promise<{ data: Backup }> {
    return this.client.post<{ data: Backup }>(
      `/mgmt/v1/spaces/${spaceId}/backups`,
      payload,
      options?.headers
    )
  }

  async getBackup(
    spaceId: string,
    backupId: string,
    options?: RequestOptions
  ): Promise<{ data: Backup }> {
    return this.client.get<{ data: Backup }>(
      `/mgmt/v1/spaces/${spaceId}/backups/${backupId}`,
      undefined,
      options?.headers
    )
  }

  async updateBackup(
    spaceId: string,
    backupId: string,
    payload: UpdateBackupParams,
    options?: RequestOptions
  ): Promise<{ data: Backup }> {
    return this.client.put<{ data: Backup }>(
      `/mgmt/v1/spaces/${spaceId}/backups/${backupId}`,
      payload,
      options?.headers
    )
  }

  async deleteBackup(spaceId: string, backupId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/backups/${backupId}`,
      options?.headers
    )
  }

  // ─── Migrations ────────────────────────────────────────────────────────────

  async listMigrations(
    spaceId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Migration>> {
    return this.client.get<PaginatedResponse<Migration>>(
      `/mgmt/v1/spaces/${spaceId}/migrations`,
      undefined,
      options?.headers
    )
  }

  async createMigration(
    spaceId: string,
    payload: CreateMigrationParams,
    options?: RequestOptions
  ): Promise<{ data: Migration }> {
    return this.client.post<{ data: Migration }>(
      `/mgmt/v1/spaces/${spaceId}/migrations`,
      payload,
      options?.headers
    )
  }

  async getMigration(
    spaceId: string,
    migrationId: string,
    options?: RequestOptions
  ): Promise<{ data: Migration }> {
    return this.client.get<{ data: Migration }>(
      `/mgmt/v1/spaces/${spaceId}/migrations/${migrationId}`,
      undefined,
      options?.headers
    )
  }

  async deleteMigration(
    spaceId: string,
    migrationId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/migrations/${migrationId}`,
      options?.headers
    )
  }

  // ─── Presence ──────────────────────────────────────────────────────────────

  async updateSpacePresence(
    spaceId: string,
    payload?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      `/mgmt/v1/spaces/${spaceId}/presence`,
      payload,
      options?.headers
    )
  }

  async leaveSpacePresence(spaceId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`/mgmt/v1/spaces/${spaceId}/presence`, options?.headers)
  }

  async updateContentPresence(
    spaceId: string,
    contentId: string,
    payload?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/presence`,
      payload,
      options?.headers
    )
  }

  async leaveContentPresence(
    spaceId: string,
    contentId: string,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.delete<void>(
      `/mgmt/v1/spaces/${spaceId}/contents/${contentId}/presence`,
      options?.headers
    )
  }

  // ─── Space Roles ───────────────────────────────────────────────────────────

  async listSpaceRoles(spaceId: string, options?: RequestOptions): Promise<{ data: Role[] }> {
    return this.client.get<{ data: Role[] }>(
      `/mgmt/v1/spaces/${spaceId}/roles/space`,
      undefined,
      options?.headers
    )
  }
}
