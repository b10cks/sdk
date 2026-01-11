import type { HttpClient } from '../http-client'
import type { AvailableModelsParams } from '../types'

export class AiResource {
  constructor(private readonly client: HttpClient) {}

  async getAvailableModels(params?: AvailableModelsParams): Promise<unknown> {
    return this.client.get<unknown>('/mgmt/v1/ai/available-models', params)
  }

  async generateMetaTags(): Promise<unknown> {
    return this.client.post<unknown>('/mgmt/v1/ai/meta-tags')
  }

  async translate(): Promise<unknown> {
    return this.client.post<unknown>('/mgmt/v1/ai/translate')
  }
}
