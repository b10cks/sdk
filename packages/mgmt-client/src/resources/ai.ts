import type { HttpClient } from '../http-client'
import type { AvailableModelsParams, RequestOptions } from '../types'

export class AiResource {
  constructor(private readonly client: HttpClient) {}

  async getAvailableModels(
    params?: AvailableModelsParams,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/ai/available-models', params, options?.headers)
  }

  async generateMetaTags(
    payload: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>('/mgmt/v1/ai/meta-tags', payload, options?.headers)
  }

  async translate(payload: Record<string, unknown>, options?: RequestOptions): Promise<unknown> {
    return this.client.post<unknown>('/mgmt/v1/ai/translate', payload, options?.headers)
  }
}
