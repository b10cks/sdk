import {
  ApiClient,
  type B10cksApiClientOptions,
  type BackgroundTasks,
  createB10cksDataApi,
  createRedirectCache,
  withBaseURL,
  withRequestQuery,
} from '@b10cks/client'
import type { NextRequest } from 'next/server'

export interface B10cksRedirectOptions extends B10cksApiClientOptions {
  /** Seconds the list stays on this instance before it is fetched again. Default 60. */
  maxAge?: number
}

/**
 * Returns a lookup of a path in the space's full redirect list.
 *
 * The list stays in memory per server instance and is never part of a page. An
 * expired list keeps answering while one refresh runs in the background. A
 * trailing slash and URL encoding do not affect the match. Create it once, at
 * module scope. Use it for a middleware with its own rules.
 */
export function createB10cksRedirectResolver({ maxAge = 60, ...options }: B10cksRedirectOptions) {
  const dataApi = createB10cksDataApi(new ApiClient(options))

  return createRedirectCache(async (signal) => {
    await dataApi.syncRevision(undefined, { signal })
    return dataApi.getRedirects({}, { forceRefresh: true, signal })
  }, maxAge)
}

/**
 * Returns a handler for `middleware.ts` (`proxy.ts` on Next.js 16) that answers
 * requests whose path has a b10cks redirect, and resolves to `undefined` for
 * all others. Create it once, at module scope.
 *
 * ```ts
 * import { createB10cksRedirects } from '@b10cks/next/middleware'
 *
 * export default createB10cksRedirects({ token: process.env.B10CKS_TOKEN!, baseUrl })
 * export const config = { matcher: ['/((?!api|_next|.*\\..*).*)'] }
 * ```
 */
export function createB10cksRedirects(options: B10cksRedirectOptions) {
  const resolve = createB10cksRedirectResolver(options)

  return async (request: NextRequest, event?: BackgroundTasks): Promise<Response | undefined> => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return

    const { basePath, pathname, search, searchParams } = request.nextUrl
    // The visual editor previews drafts. A redirect would move it off the entry being edited.
    if (searchParams.has('b10cks_vid')) return

    const hit = await resolve(pathname, event)
    if (!hit) return

    const target = withRequestQuery(withBaseURL(hit.target, basePath || '/'), search)
    return new Response(null, {
      status: hit.status_code || 301,
      headers: { Location: new URL(target, request.url).href },
    })
  }
}
