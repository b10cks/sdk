import type { HttpClient } from '../http-client'
import type { AiModel, AvailableModelsParams, RequestOptions } from '../types'

export class AiResource {
  constructor(private readonly client: HttpClient) {}

  async getAvailableModels(
    params?: AvailableModelsParams,
    options?: RequestOptions
  ): Promise<{ data: AiModel[] }> {
    return this.client.get<{ data: AiModel[] }>(
      '/mgmt/v1/ai/available-models',
      params,
      options?.headers
    )
  }

  async getModels(options?: RequestOptions): Promise<{ data: AiModel[] }> {
    return this.client.get<{ data: AiModel[] }>('/mgmt/v1/ai/models', undefined, options?.headers)
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

  async translateStream(
    payload: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>('/mgmt/v1/ai/translate/stream', payload, options?.headers)
  }

  async contentInteractionStream(
    payload: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      '/mgmt/v1/ai/content-interaction/stream',
      payload,
      options?.headers
    )
  }

  async contentTreeInteractionStream(
    payload: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.client.post<unknown>(
      '/mgmt/v1/ai/content-tree-interaction/stream',
      payload,
      options?.headers
    )
  }
}
