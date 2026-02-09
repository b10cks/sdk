import type { HttpClient } from '../http-client'
import type { RequestOptions } from '../types'

export class SystemResource {
  constructor(private readonly client: HttpClient) {}

  async health(options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/health', undefined, options?.headers)
  }

  async getConfig(options?: RequestOptions): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/config', undefined, options?.headers)
  }
}
