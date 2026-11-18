import type { B10cksDataApi, RedirectMap } from '@b10cks/client'

import { useRuntimeConfig } from '#imports'

import { type BackgroundTasks, createRedirectCache } from './redirectCache'
import { useB10cksServerApi } from './useB10cksServerApi'

/** One list per data API, which `useB10cksServerApi` shares per space. */
const caches = new WeakMap<B10cksDataApi, ReturnType<typeof createRedirectCache>>()

/**
 * The redirect for a request path, from the space's full redirect list.
 *
 * The list stays on this server instance for `redirects.maxAge` seconds (60
 * by default) and is never part of a page payload. A trailing slash and URL
 * encoding do not affect the match. The module applies it to every request
 * unless `redirects` is off. Call it yourself for a middleware with its own
 * rules, and pass the event so that a refresh outlives the response on
 * serverless hosts.
 *
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const hit = await resolveB10cksRedirect(getRequestURL(event).pathname, event)
 *   if (hit) return sendRedirect(event, hit.target, hit.status_code || 301)
 * })
 * ```
 */
export async function resolveB10cksRedirect(
  path: string,
  event?: BackgroundTasks
): Promise<RedirectMap[string] | undefined> {
  const api = useB10cksServerApi()

  let resolve = caches.get(api)
  if (!resolve) {
    resolve = createRedirectCache(async (signal) => {
      await api.syncRevision(undefined, { signal })
      return api.getRedirects({}, { forceRefresh: true, signal })
    }, useRuntimeConfig().public.b10cks.redirectsMaxAge)
    caches.set(api, resolve)
  }

  return resolve(path, event)
}
