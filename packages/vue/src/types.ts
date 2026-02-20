import type { ApiClient, B10cksApiClientOptions, B10cksDataApi, FetchClient } from '@b10cks/client'
import type { Component, InjectionKey } from 'vue'

export interface B10cksVuePluginOptions {
  apiClientOptions?: B10cksApiClientOptions
  client?: ApiClient
  dataApi?: B10cksDataApi
  requestUrl?: URL | string
  token?: string
  baseUrl?: string
  accessToken?: string
  apiUrl?: string
  version?: 'draft' | 'published'
  rv?: string | number
  fetchClient?: FetchClient
  getRv?: () => string | number
  setRv?: (value: string | number) => void
}

export type BlockComponentResolver = (componentName: string) => Promise<Component>

export const B10cksComponentResolverKey: InjectionKey<BlockComponentResolver> = Symbol(
  'b10cks:resolveBlockComponent'
)

export const B10cksClientKey: InjectionKey<ApiClient> = Symbol('b10cks:client')
export const B10cksDataApiKey: InjectionKey<B10cksDataApi> = Symbol('b10cks:data-api')
