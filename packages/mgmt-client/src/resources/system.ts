import { apiPath } from '../http-client'
import type { HttpClient } from '../http-client'
import type {
  Authorization,
  GetAuthorizationParams,
  GetSpaceBlueprintsParams,
  PaginatedResponse,
  Plan,
  PublicInvite,
  RequestOptions,
  SpaceBlueprintListItem,
} from '../types'

export class SystemResource {
  constructor(private readonly client: HttpClient) {}

  async health(options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/health', undefined, options?.headers)
  }

  async getConfig(options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/config', undefined, options?.headers)
  }

  async getPlans(options?: RequestOptions): Promise<{ data: Plan[] }> {
    return this.client.get<{ data: Plan[] }>('/mgmt/v1/plans', undefined, options?.headers)
  }

  /**
   * The caller's effective permissions. Without params it lists every team and
   * space they can reach; pass `team_id` or `space_id` to resolve the
   * abilities for one context instead.
   */
  async getAuthorization(
    params?: GetAuthorizationParams,
    options?: RequestOptions
  ): Promise<{ data: Authorization }> {
    return this.client.get<{ data: Authorization }>(
      '/mgmt/v1/authorization',
      params,
      options?.headers
    )
  }

  /** Space blueprints the caller can create a space from. */
  async listSpaceBlueprints(
    params?: GetSpaceBlueprintsParams,
    options?: RequestOptions
  ): Promise<PaginatedResponse<SpaceBlueprintListItem>> {
    return this.client.get<PaginatedResponse<SpaceBlueprintListItem>>(
      '/mgmt/v1/space-blueprints',
      params,
      options?.headers
    )
  }

  /** Reads an invite without authenticating — for rendering an invite landing page. */
  async getInvite(inviteId: string, options?: RequestOptions): Promise<{ data: PublicInvite }> {
    return this.client.get<{ data: PublicInvite }>(
      apiPath`/mgmt/v1/invites/${inviteId}`,
      undefined,
      options?.headers
    )
  }
}
