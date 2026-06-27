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
  /**
   * Offset applied when a selected block is scrolled into view, so selection
   * clears a fixed app header. A number is pixels; strings are used verbatim.
   * Can also be set in CSS via `--b10cks-scroll-offset`.
   */
  scrollOffset?: number | string
  /** Editor origins allowed to drive the preview bridge. */
  allowedOrigins?: string[]
}

export type BlockComponentResolver = (componentName: string) => Promise<Component>

export const B10cksComponentResolverKey: InjectionKey<BlockComponentResolver> = Symbol(
  'b10cks:resolveBlockComponent'
)

export const B10cksClientKey: InjectionKey<ApiClient> = Symbol('b10cks:client')
export const B10cksDataApiKey: InjectionKey<B10cksDataApi> = Symbol('b10cks:data-api')
