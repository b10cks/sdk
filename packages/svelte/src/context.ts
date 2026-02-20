import {
  ApiClient,
  createB10cksDataApi,
  previewBridge,
  type B10cksApiClientOptions,
  type B10cksDataApi,
} from '@b10cks/client'
import { getContext, setContext } from 'svelte'

const CLIENT_CONTEXT_KEY = Symbol('b10cks:client')
const DATA_API_CONTEXT_KEY = Symbol('b10cks:data-api')

export interface CreateB10cksContextOptions {
  apiClientOptions?: B10cksApiClientOptions
  client?: ApiClient
  dataApi?: B10cksDataApi
  requestUrl?: URL | string
}

export type B10cksContextValue = {
  client: ApiClient | null
  dataApi: B10cksDataApi | null
}

export function createB10cksContext(options: CreateB10cksContextOptions = {}): B10cksContextValue {
  const client =
    options.client ||
    (options.apiClientOptions ? new ApiClient(options.apiClientOptions, options.requestUrl) : null)
  const dataApi = options.dataApi || (client ? createB10cksDataApi(client) : null)

  if (previewBridge.isInPreviewMode()) {
    previewBridge.init()
  }

  const contextValue = { client, dataApi }
  setContext<B10cksContextValue>(CLIENT_CONTEXT_KEY, contextValue)
  setContext<B10cksContextValue>(DATA_API_CONTEXT_KEY, contextValue)

  return contextValue
}

export function getB10cksContext(): B10cksContextValue {
  const context = getContext<B10cksContextValue>(DATA_API_CONTEXT_KEY)
  if (!context) {
    throw new Error(
      'B10cks context is missing. Call createB10cksContext in a parent component before using b10cks stores.'
    )
  }

  return context
}

export function getB10cksDataApi(): B10cksDataApi {
  const context = getB10cksContext()
  if (!context.dataApi) {
    throw new Error('B10cks data API is not configured in context.')
  }
  return context.dataApi
}

export function getB10cksClient() {
  return getB10cksContext().client
}
