import type { HttpClient } from '../http-client'
import type { Plan, RequestOptions } from '../types'

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
}
