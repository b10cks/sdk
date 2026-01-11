import type { HttpClient } from '../http-client'

export class SystemResource {
  constructor(private readonly client: HttpClient) {}

  async health(): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/health')
  }

  async getConfig(): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/config')
  }
}
