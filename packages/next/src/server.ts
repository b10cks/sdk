import { ApiClient, createB10cksDataApi, type B10cksApiClientOptions } from '@b10cks/client'
import { cache } from 'react'

import { withB10cks } from './with-b10cks'

export interface CreateB10cksNextApiOptions extends B10cksApiClientOptions {
  requestUrl?: URL | string
}

export interface B10cksNextApi {
  client: ApiClient
  dataApi: ReturnType<typeof createB10cksDataApi>
}

/**
 * Creates a fresh b10cks API client and data API.
 *
 * IMPORTANT: the returned client holds request-scoped state — the content
 * revision (`rv`, which a preview/draft request pins) and per-instance caches.
 * Never hoist the result into a module-level singleton in a long-lived server:
 * a preview request would pin a draft revision that then bleeds to every
 * subsequent visitor. Create it per request, or use
 * {@link defineB10cksNextApi} which does that for you in the App Router.
 */
export function createB10cksNextApi({
  requestUrl,
  ...apiClientOptions
}: CreateB10cksNextApiOptions): B10cksNextApi {
  const client = new ApiClient(apiClientOptions, requestUrl)
  const dataApi = createB10cksDataApi(client)

  return {
    client,
    dataApi,
  }
}

/**
 * Returns a request-scoped accessor for the b10cks API, safe to export at
 * module scope in the Next.js App Router. It wraps {@link createB10cksNextApi}
 * in React's `cache()`, so every server request render gets its own client
 * (with its own revision and caches) while a single request reuses one
 * instance. `optionsFactory` runs once per request — read per-request values
 * (e.g. `headers()`/`draftMode()`) inside it.
 *
 * ```ts
 * // b10cks.ts
 * export const getB10cks = defineB10cksNextApi(() => ({
 *   baseUrl: process.env.B10CKS_API_URL!,
 *   token: process.env.B10CKS_TOKEN!,
 *   requestUrl: new URL(headers().get('x-url') ?? 'http://localhost'),
 * }))
 * ```
 */
export function defineB10cksNextApi(
  optionsFactory: () => CreateB10cksNextApiOptions
): () => B10cksNextApi {
  return cache(() => createB10cksNextApi(optionsFactory()))
}

export { withB10cks }
