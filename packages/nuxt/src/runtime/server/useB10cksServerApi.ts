import type { B10cksDataApi } from '@b10cks/client'
import { ApiClient, createB10cksDataApi } from '@b10cks/client'

import { useRuntimeConfig } from '#imports'

import { createFetchClient } from '../fetch-client'

/** One data API per space, so its caches outlive a single request. */
const instances = new Map<string, B10cksDataApi>()

/**
 * Data API for nitro contexts (server routes, middleware, plugins), where the
 * Vue injection the module's plugin sets up is not available.
 *
 * The instance is shared per space, so the data API's own redirect and config
 * caches survive across requests instead of every route hand-rolling a TTL
 * cache. That also means the revision is shared: call `syncRevision()` when a
 * route must read the newest published state.
 *
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const api = useB10cksServerApi()
 *   const redirects = await api.getRedirects({}, { allPages: true })
 *   const hit = redirects[getRequestURL(event).pathname]
 *   if (hit) return sendRedirect(event, hit.target, hit.status_code || 301)
 * })
 * ```
 */
export function useB10cksServerApi(): B10cksDataApi {
  const { apiUrl, accessToken, timeoutMs, retries, maxConcurrency } =
    useRuntimeConfig().public.b10cks
  const baseUrl = apiUrl || 'https://api.b10cks.com/api'
  const cacheKey = `${baseUrl}|${accessToken}`

  const cached = instances.get(cacheKey)
  if (cached) return cached

  const api = createB10cksDataApi(
    new ApiClient({
      baseUrl,
      token: accessToken,
      fetchClient: createFetchClient(),
      timeoutMs,
      retries,
      maxConcurrency,
    })
  )
  instances.set(cacheKey, api)

  return api
}
