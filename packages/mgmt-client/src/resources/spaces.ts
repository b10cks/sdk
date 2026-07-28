import { apiPath } from '../http-client'
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
  Invoice,
  Migration,
  PaginatedResponse,
  PaginationParams,
  RequestOptions,
  Space,
  SpaceAiConfig,
  SpaceAiSettings,
  SpaceMember,
  SpaceUsage,
  Subscription,
  SubscriptionPeriod,
  UpdateBackupParams,
  UpdateSpaceAiConfigParams,
  UpdateSpaceAiSettingsParams,
  UpdateSpaceIconParams,
  UpdateSpaceOnboardingParams,
  UpdateSpaceParams,
  UsageTimeseries,
  UsageTimeseriesMetric,
} from '../types'

export class SpacesResource {
  constructor(private readonly client: HttpClient) {}

  async list(
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Space>> {
    return this.client.get<PaginatedResponse<Space>>('/mgmt/v1/spaces', params, options?.headers)
  }

  async create(params: CreateSpaceParams, options?: RequestOptions): Promise<Space> {
    return this.client.post<Space>('/mgmt/v1/spaces', params, options?.headers)
  }

  async get(spaceId: string, options?: RequestOptions): Promise<Space> {
    return this.client.get<Space>(apiPath`/mgmt/v1/spaces/${spaceId}`, undefined, options?.headers)
  }

  async update(
    spaceId: string,
    params: UpdateSpaceParams,
    options?: RequestOptions
  ): Promise<Space> {
    return this.client.put<Space>(apiPath`/mgmt/v1/spaces/${spaceId}`, params, options?.headers)
  }

  async delete(spaceId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(apiPath`/mgmt/v1/spaces/${spaceId}`, options?.headers)
  }

  async updateIcon(
    spaceId: string,
    params: UpdateSpaceIconParams,
    options?: RequestOptions
  ): Promise<void> {
    return this.client.post<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/icon`,
      params,
      options?.headers
    )
  }

  async archive(spaceId: string, options?: RequestOptions): Promise<void> {
    return this.client.post<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/archive`,
      undefined,
      options?.headers
    )
  }

  async getAiUsage(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-usage`,
      undefined,
      options?.headers
    )
  }

  async getStats(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/stats`,
      undefined,
      options?.headers
    )
  }

  /** Live usage for the current billing period, metered against the plan quota. */
  async getUsage(spaceId: string, options?: RequestOptions): Promise<{ data: SpaceUsage }> {
    return this.client.get<{ data: SpaceUsage }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/usage`,
      undefined,
      options?.headers
    )
  }

  /** Usage rolled up per billing period, newest first. */
  async getUsageHistory(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ data: SubscriptionPeriod[] }> {
    return this.client.get<{ data: SubscriptionPeriod[] }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/usage/history`,
      undefined,
      options?.headers
    )
  }

  /** Day-bucketed usage for one billing period. Defaults to the `traffic` metric. */
  async getUsageTimeseries(
    spaceId: string,
    periodId: string,
    params?: { metric?: UsageTimeseriesMetric },
    options?: RequestOptions
  ): Promise<{ data: UsageTimeseries }> {
    return this.client.get<{ data: UsageTimeseries }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/usage/history/${periodId}/timeseries`,
      params,
      options?.headers
    )
  }

  /** Billing invoices. Resolves to an empty list when billing is not configured. */
  async listInvoices(spaceId: string, options?: RequestOptions): Promise<{ data: Invoice[] }> {
    return this.client.get<{ data: Invoice[] }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/invoices`,
      undefined,
      options?.headers
    )
  }

  /** Dismisses (or restores) the space's onboarding guide. */
  async updateOnboarding(
    spaceId: string,
    payload: UpdateSpaceOnboardingParams,
    options?: RequestOptions
  ): Promise<{ data: Space }> {
    return this.client.patch<{ data: Space }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/onboarding`,
      payload,
      options?.headers
    )
  }

  async getContentMenu(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/content-menu`,
      undefined,
      options?.headers
    )
  }

  // ─── Members ───────────────────────────────────────────────────────────────

  async listMembers(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<SpaceMember>> {
    return this.client.get<PaginatedResponse<SpaceMember>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/members`,
      params,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/members/${userId}`,
      payload,
      options?.headers
    )
  }

  async removeMember(spaceId: string, userId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/members/${userId}`,
      options?.headers
    )
  }

  // ─── Invites ───────────────────────────────────────────────────────────────

  async listInvites(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Invite>> {
    return this.client.get<PaginatedResponse<Invite>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/invites`,
      params,
      options?.headers
    )
  }

  async createInvite(
    spaceId: string,
    payload: CreateInviteParams,
    options?: RequestOptions
  ): Promise<Invite> {
    return this.client.post<Invite>(
      apiPath`/mgmt/v1/spaces/${spaceId}/invites`,
      payload,
      options?.headers
    )
  }

  async deleteInvite(spaceId: string, inviteId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/invites/${inviteId}`,
      options?.headers
    )
  }

  async resendInvite(spaceId: string, inviteId: string, options?: RequestOptions): Promise<void> {
    return this.client.post<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/invites/${inviteId}/resend`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/search`,
      payload,
      options?.headers
    )
  }

  async reindexSearch(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.post<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/search/reindex`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/subscriptions`,
      options?.query,
      options?.headers
    )
  }

  async getCurrentSubscription(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ data: Subscription | null }> {
    return this.client.get<{ data: Subscription | null }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/subscriptions/current`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/subscriptions/checkout`,
      payload,
      options?.headers
    )
  }

  async reinitSubscription(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ checkout_url: string }> {
    return this.client.post<{ checkout_url: string }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/subscriptions/reinit`,
      undefined,
      options?.headers
    )
  }

  async cancelSubscription(
    spaceId: string,
    options?: RequestOptions
  ): Promise<{ message: string }> {
    return this.client.post<{ message: string }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/subscriptions/cancel`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-settings`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-settings`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-configs`,
      options?.query,
      options?.headers
    )
  }

  async createAiConfig(
    spaceId: string,
    payload: CreateSpaceAiConfigParams,
    options?: RequestOptions
  ): Promise<{ data: SpaceAiConfig }> {
    return this.client.post<{ data: SpaceAiConfig }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-configs`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-configs/${configId}`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-configs/${configId}`,
      payload,
      options?.headers
    )
  }

  async deleteAiConfig(spaceId: string, configId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/ai-configs/${configId}`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/audit-logs`,
      params,
      options?.headers
    )
  }

  // ─── Backups ───────────────────────────────────────────────────────────────

  async listBackups(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Backup>> {
    return this.client.get<PaginatedResponse<Backup>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/backups`,
      params,
      options?.headers
    )
  }

  async createBackup(
    spaceId: string,
    payload: CreateBackupParams,
    options?: RequestOptions
  ): Promise<{ data: Backup }> {
    return this.client.post<{ data: Backup }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/backups`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/backups/${backupId}`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/backups/${backupId}`,
      payload,
      options?.headers
    )
  }

  async deleteBackup(spaceId: string, backupId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/backups/${backupId}`,
      options?.headers
    )
  }

  // ─── Migrations ────────────────────────────────────────────────────────────

  async listMigrations(
    spaceId: string,
    params?: PaginationParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<Migration>> {
    return this.client.get<PaginatedResponse<Migration>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/migrations`,
      params,
      options?.headers
    )
  }

  async createMigration(
    spaceId: string,
    payload: CreateMigrationParams,
    options?: RequestOptions
  ): Promise<{ data: Migration }> {
    return this.client.post<{ data: Migration }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/migrations`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/migrations/${migrationId}`,
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
      apiPath`/mgmt/v1/spaces/${spaceId}/migrations/${migrationId}`,
      options?.headers
    )
  }
}
