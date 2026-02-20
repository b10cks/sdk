import { ApiClient, createB10cksDataApi, type B10cksApiClientOptions } from '@b10cks/client'

import { withB10cks } from './with-b10cks'

export interface CreateB10cksNextApiOptions extends B10cksApiClientOptions {
  requestUrl?: URL | string
}

export function createB10cksNextApi({
  requestUrl,
  ...apiClientOptions
}: CreateB10cksNextApiOptions) {
  const client = new ApiClient(apiClientOptions, requestUrl)
  const dataApi = createB10cksDataApi(client)

  return {
    client,
    dataApi,
  }
}

export { withB10cks }
