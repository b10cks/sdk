import {
  ApiClient,
  createB10cksDataApi,
  type B10cksApiClientOptions,
  type IBContent,
  type IBContentQueryParams,
} from '@b10cks/client'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { cache } from 'react'

import { withB10cks } from './with-b10cks'

export interface CreateB10cksNextApiOptions extends B10cksApiClientOptions {
  requestUrl?: URL | string
}

export interface B10cksNextApi {
  client: ApiClient
  dataApi: ReturnType<typeof createB10cksDataApi>
  /**
   * The entry that is the page of the current route, read at the latest
   * published revision. A slug that has a redirect redirects, and a missing slug
   * renders the nearest `not-found` page, so the result is always an entry.
   * Call it in a Server Component, outside `try`.
   */
  getRouteContent: <T = Record<string, unknown>>(
    fullSlug: string,
    params?: Omit<IBContentQueryParams, 'token' | 'full_slug'>
  ) => Promise<IBContent<T>>
}

/** Redirect codes that tell browsers and crawlers to remember the new address. */
const PERMANENT_REDIRECTS = new Set([301, 308])

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

  // A preview request pins its revision through the URL, which a sync must not replace.
  let revision: Promise<unknown> | undefined
  const syncRevision = () =>
    (revision ??= client.getRv() ? Promise.resolve() : dataApi.syncRevision().catch(() => {}))

  const getRouteContent: B10cksNextApi['getRouteContent'] = async <T>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {}
  ) => {
    await syncRevision()
    const result = await dataApi.resolveContent<T>(fullSlug, params)

    if (result.type === 'content') return result.content
    if (result.type === 'not_found') notFound()
    if (PERMANENT_REDIRECTS.has(result.status_code)) permanentRedirect(result.target)
    redirect(result.target)
  }

  return {
    client,
    dataApi,
    getRouteContent,
  }
}

/**
 * Returns a request-scoped accessor for the b10cks API, safe to export at
 * module scope in the Next.js App Router. It wraps {@link createB10cksNextApi}
 * in React's `cache()`, so every server request render gets its own client
 * (with its own revision and caches) while a single request reuses one
 * instance. `optionsFactory` runs once per request and is synchronous.
 *
 * ```ts
 * // b10cks.ts
 * export const getB10cks = defineB10cksNextApi(() => ({
 *   baseUrl: process.env.B10CKS_API_URL!,
 *   token: process.env.B10CKS_TOKEN!,
 * }))
 * ```
 */
export function defineB10cksNextApi(
  optionsFactory: () => CreateB10cksNextApiOptions
): () => B10cksNextApi {
  return cache(() => createB10cksNextApi(optionsFactory()))
}

export { getPageTranslations } from './page-translations'
export type { ContentForTranslations, PageTranslations } from './page-translations'
export { withB10cks }
