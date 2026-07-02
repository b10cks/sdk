import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  Automation,
  AutomationAction,
  AutomationExecution,
  AutomationStatsParams,
  CreateAutomationActionParams,
  CreateAutomationParams,
  GetAutomationExecutionsParams,
  PaginatedResponse,
  RequestOptions,
  UpdateAutomationActionParams,
  UpdateAutomationParams,
} from '../types'

export class AutomationsResource {
  constructor(private readonly client: HttpClient) {}

  // ─── Automation Actions ────────────────────────────────────────────────────

  async listActions(
    spaceId: string,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AutomationAction>> {
    return this.client.get<PaginatedResponse<AutomationAction>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automation-actions`,
      options?.query,
      options?.headers
    )
  }

  async createAction(
    spaceId: string,
    payload: CreateAutomationActionParams,
    options?: RequestOptions
  ): Promise<{ data: AutomationAction }> {
    return this.client.post<{ data: AutomationAction }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automation-actions`,
      payload,
      options?.headers
    )
  }

  async getAction(
    spaceId: string,
    actionId: string,
    options?: RequestOptions
  ): Promise<{ data: AutomationAction }> {
    return this.client.get<{ data: AutomationAction }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automation-actions/${actionId}`,
      undefined,
      options?.headers
    )
  }

  async updateAction(
    spaceId: string,
    actionId: string,
    payload: UpdateAutomationActionParams,
    options?: RequestOptions
  ): Promise<{ data: AutomationAction }> {
    return this.client.patch<{ data: AutomationAction }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automation-actions/${actionId}`,
      payload,
      options?.headers
    )
  }

  async deleteAction(spaceId: string, actionId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automation-actions/${actionId}`,
      options?.headers
    )
  }

  // ─── Automations ───────────────────────────────────────────────────────────

  async getTriggerCatalog(spaceId: string, options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/trigger-catalog`,
      undefined,
      options?.headers
    )
  }

  async list(spaceId: string, options?: RequestOptions): Promise<PaginatedResponse<Automation>> {
    return this.client.get<PaginatedResponse<Automation>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations`,
      options?.query,
      options?.headers
    )
  }

  async create(
    spaceId: string,
    payload: CreateAutomationParams,
    options?: RequestOptions
  ): Promise<{ data: Automation }> {
    return this.client.post<{ data: Automation }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations`,
      payload,
      options?.headers
    )
  }

  async get(
    spaceId: string,
    automationId: string,
    options?: RequestOptions
  ): Promise<{ data: Automation }> {
    return this.client.get<{ data: Automation }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}`,
      undefined,
      options?.headers
    )
  }

  async update(
    spaceId: string,
    automationId: string,
    payload: UpdateAutomationParams,
    options?: RequestOptions
  ): Promise<{ data: Automation }> {
    return this.client.patch<{ data: Automation }>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}`,
      payload,
      options?.headers
    )
  }

  async delete(spaceId: string, automationId: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}`,
      options?.headers
    )
  }

  async trigger(
    spaceId: string,
    automationId: string,
    payload?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}/trigger`,
      payload,
      options?.headers
    )
  }

  // ─── Automation Stats ──────────────────────────────────────────────────────

  async getStatsExecutions(
    spaceId: string,
    automationId: string,
    params?: AutomationStatsParams,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}/stats/executions`,
      params,
      options?.headers
    )
  }

  async getStatsTrends(
    spaceId: string,
    automationId: string,
    params?: AutomationStatsParams,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}/stats/trends`,
      params,
      options?.headers
    )
  }

  async getStatsStatistics(
    spaceId: string,
    automationId: string,
    params?: AutomationStatsParams,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}/stats/statistics`,
      params,
      options?.headers
    )
  }

  async getStatsSummary(
    spaceId: string,
    automationId: string,
    params?: AutomationStatsParams,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.get<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automations/${automationId}/stats/summary`,
      params,
      options?.headers
    )
  }

  // ─── Automation Executions ─────────────────────────────────────────────────

  async listExecutions(
    spaceId: string,
    params?: GetAutomationExecutionsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<AutomationExecution>> {
    return this.client.get<PaginatedResponse<AutomationExecution>>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automation-executions`,
      params,
      options?.headers
    )
  }

  async replayExecution(
    spaceId: string,
    executionId: string,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      apiPath`/mgmt/v1/spaces/${spaceId}/automation-executions/${executionId}/replay`,
      options?.query,
      options?.headers
    )
  }
}
