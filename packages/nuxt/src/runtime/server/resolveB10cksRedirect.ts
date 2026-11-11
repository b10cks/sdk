import type { B10cksDataApi, RedirectMap } from '@b10cks/client'

import { useRuntimeConfig } from '#imports'

import { useB10cksServerApi } from './useB10cksServerApi'

interface RedirectList {
  redirects: RedirectMap
  expiresAt: number
  loading?: Promise<void>
}

/** One list per data API, which `useB10cksServerApi` shares per space. */
const lists = new WeakMap<B10cksDataApi, RedirectList>()

async function redirectList(): Promise<RedirectMap> {
  const api = useB10cksServerApi()
  const maxAge = useRuntimeConfig().public.b10cks.redirectsMaxAge ?? 60
  const list = lists.get(api) ?? { redirects: {}, expiresAt: 0 }
  lists.set(api, list)

  if (Date.now() >= list.expiresAt) {
    // Concurrent requests share one refresh. A failed refresh keeps the list
    // it had and waits for the next interval, so an API outage costs redirects
    // their freshness, never the page its render.
    list.loading ??= api
      .syncRevision()
      .then(() => api.getRedirects({}, { forceRefresh: true }))
      .then(
        (redirects) => {
          list.redirects = redirects
        },
        (error: unknown) => console.warn('[b10cks] Could not load redirects', error)
      )
      .finally(() => {
        list.expiresAt = Date.now() + maxAge * 1000
        list.loading = undefined
      })
    await list.loading
  }

  return list.redirects
}

/**
 * The redirect for a request path, from the space's full redirect list.
 *
 * The list stays on this server instance for `redirects.maxAge` seconds (60
 * by default) and is never part of a page payload. The module's `redirects`
 * option applies it to every request. Call it yourself for a middleware with
 * its own rules.
 *
 * ```ts
 * export default defineEventHandler(async (event) => {
 *   const hit = await resolveB10cksRedirect(getRequestURL(event).pathname)
 *   if (hit) return sendRedirect(event, hit.target, hit.status_code || 301)
 * })
 * ```
 */
export async function resolveB10cksRedirect(
  path: string
): Promise<RedirectMap[string] | undefined> {
  const redirects = await redirectList()
  // `Object.hasOwn` keeps paths like `/constructor` off the object's prototype.
  return Object.hasOwn(redirects, path) ? redirects[path] : undefined
}
