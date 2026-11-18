import type {
  Endpoint,
  GetConfigOptions,
  IBBaseQueryParams,
  IBBlock,
  IBBreadcrumbLevel,
  IBBreadcrumbParams,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataEntryParams,
  IBDataSource,
  IBGetContentsParams,
  IBSitemapEntry,
  IBSpace,
  RedirectMap,
} from '@b10cks/client'
import { ApiError, ContentRedirectError } from '@b10cks/client'
import { useB10cksApi as useVueB10cksApi } from '@b10cks/vue'
import type { AsyncDataOptions } from 'nuxt/app'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import {
  callOnce,
  navigateTo,
  reloadNuxtApp,
  showError,
  useAsyncData,
  useNuxtApp,
  useRouter,
  useRuntimeConfig,
} from '#app'

type VueB10cksApi = ReturnType<typeof useVueB10cksApi>
// `sort` is omitted because content params widen it to `string | ContentSortItem[]`,
// which is incompatible with the base `sort?: string`. Concrete param types (e.g.
// IBGetContentsParams) re-add their own `sort`.
type QueryParams = Omit<IBBaseQueryParams, 'token' | 'sort'>

/** What an awaited `useAsyncData` returns when its data is `R`. */
type AwaitedAsyncData<R> = Awaited<ReturnType<typeof useAsyncData<unknown, Error, R | undefined>>>

/**
 * `useAsyncData` options for a query that fetches `T` and exposes `R`.
 *
 * Without `key`, the key derives from the query's inputs and follows them when
 * they are refs or getters. A custom key should do the same, e.g. a getter.
 *
 * `transform` maps the fetched value before it is stored, so its result is
 * what gets typed and what is serialised into the page payload.
 */
type AsyncDataConfig<T, R = T> = Omit<AsyncDataOptions<T, R>, 'default' | 'watch'> & {
  key?: MaybeRefOrGetter<string>
}

export type UseNuxtB10cksConfigResult<T> = AwaitedAsyncData<T> & {
  config: import('vue').ComputedRef<T>
}

export type UseNuxtB10cksApiOptions<
  T,
  P extends QueryParams = QueryParams,
  R = T,
> = AsyncDataConfig<T, R> & {
  params?: MaybeRefOrGetter<P>
}

export type UseNuxtB10cksCollectionOptions<
  T,
  P extends QueryParams = QueryParams,
  R = T[],
> = AsyncDataConfig<T[], R> & {
  allPages?: boolean
  params?: MaybeRefOrGetter<P>
}

export type UseNuxtB10cksContentOptions<T, R = IBContent<T>> = AsyncDataConfig<IBContent<T>, R> & {
  /**
   * The entry is the page of the current route. A slug that has a redirect
   * navigates to its target with the redirect's status code, and a missing
   * slug shows Nuxt's error page with status 404. Without it both cases only
   * set `error`, as a `ContentRedirectError` or an `ApiError` of status 404.
   */
  forRoute?: boolean
}

export type UseNuxtB10cksContentsOptions<T, R = IBContent<T>[]> = UseNuxtB10cksCollectionOptions<
  IBContent<T>,
  IBGetContentsParams,
  R
>

export type UseNuxtB10cksBreadcrumbOptions<T, R = IBBreadcrumbLevel<T>[]> = AsyncDataConfig<
  IBBreadcrumbLevel<T>[],
  R
>

export type UseNuxtB10cksRedirectsOptions<R = RedirectMap> = AsyncDataConfig<RedirectMap, R> & {
  /** Defaults to true: a redirect map that stops after the first page is incomplete. */
  allPages?: boolean
  params?: MaybeRefOrGetter<QueryParams>
  forceRefresh?: boolean
}

type ContentParams = Omit<IBContentQueryParams, 'token' | 'full_slug'>
type SitemapParams = Omit<IBContentQueryParams, 'token'>

export type NuxtB10cksApi = Omit<
  VueB10cksApi,
  | 'useApiResource'
  | 'useApiCollection'
  | 'useContent'
  | 'useContents'
  | 'useBreadcrumb'
  | 'useBlocks'
  | 'useDataEntries'
  | 'useDataSources'
  | 'useSitemap'
  | 'useNamedSitemap'
  | 'useSpace'
  | 'useRedirects'
  | 'useB10cksConfig'
> & {
  useApiResource: <T, R = T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options?: UseNuxtB10cksApiOptions<T, QueryParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useApiCollection: <T, R = T[]>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options?: UseNuxtB10cksCollectionOptions<T, QueryParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useContent: <T = Record<string, unknown>, R = IBContent<T>>(
    fullSlug: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<ContentParams>,
    options?: UseNuxtB10cksContentOptions<T, R>
  ) => Promise<AwaitedAsyncData<R>>
  useContents: <T = Record<string, unknown>, R = IBContent<T>[]>(
    params?: MaybeRefOrGetter<IBGetContentsParams>,
    options?: UseNuxtB10cksContentsOptions<T, R>
  ) => Promise<AwaitedAsyncData<R>>
  useBreadcrumb: <T = Record<string, unknown>, R = IBBreadcrumbLevel<T>[]>(
    slug: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<IBBreadcrumbParams>,
    options?: UseNuxtB10cksBreadcrumbOptions<T, R>
  ) => Promise<AwaitedAsyncData<R>>
  useBlocks: <R = IBBlock[]>(
    params?: MaybeRefOrGetter<QueryParams>,
    options?: UseNuxtB10cksCollectionOptions<IBBlock, QueryParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useDataEntries: <R = IBDataEntry[]>(
    source: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<IBDataEntryParams>,
    options?: UseNuxtB10cksCollectionOptions<IBDataEntry, QueryParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useDataSources: <R = IBDataSource[]>(
    options?: UseNuxtB10cksCollectionOptions<IBDataSource, QueryParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useSitemap: <R = IBSitemapEntry[]>(
    params?: MaybeRefOrGetter<SitemapParams>,
    options?: UseNuxtB10cksCollectionOptions<IBSitemapEntry, SitemapParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useNamedSitemap: <R = IBSitemapEntry[]>(
    name: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<SitemapParams>,
    options?: UseNuxtB10cksCollectionOptions<IBSitemapEntry, SitemapParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useSpace: <R = IBSpace>(
    options?: UseNuxtB10cksApiOptions<IBSpace, QueryParams, R>
  ) => Promise<AwaitedAsyncData<R>>
  useRedirects: <R = RedirectMap>(
    options?: UseNuxtB10cksRedirectsOptions<R>
  ) => Promise<AwaitedAsyncData<R>>
  useB10cksConfig: <T = Record<string, unknown>>(
    params?: MaybeRefOrGetter<Omit<GetConfigOptions, 'signal'>>,
    options?: AsyncDataConfig<T>
  ) => Promise<UseNuxtB10cksConfigResult<T>>
}

/** A redirect target on another host, which `navigateTo` only follows when told so. */
const ABSOLUTE_URL = /^(?:[a-z][a-z\d+.-]*:)?\/\//i

/** `callOnce` key of the revision sync, shared by every `useB10cksApi` call. */
const REVISION_KEY = 'b10cks:sync-revision'

/**
 * Data composables backed by `useAsyncData`. Slugs, names and params accept
 * refs or getters: the default async-data key follows them, so a change
 * fetches the new query. Requests are cancelled when Nuxt aborts the handler.
 */
export const useB10cksApi = (): NuxtB10cksApi => {
  const api = useVueB10cksApi()
  const nuxtApp = useNuxtApp()

  // Every query waits for the space revision, so the first requests already
  // read the latest published state. Runs once per server request; the client
  // takes the result from the payload. A failed sync leaves the current
  // revision in place, and the query reports its own error if the API is down.
  const revision = callOnce(REVISION_KEY, async () => {
    await api.syncRevision()
  }).catch(() => {})

  /** Run `load` after the revision is synced, under the handler's abort signal. */
  const query =
    <T>(load: (signal: AbortSignal) => Promise<T>) =>
    async (_nuxtApp: unknown, { signal }: { signal: AbortSignal }) => {
      await revision
      return load(signal)
    }

  const keyOf = (
    key: MaybeRefOrGetter<string> | undefined,
    scope: string,
    inputs: () => unknown
  ): MaybeRefOrGetter<string> => key ?? (() => createAsyncDataKey(scope, inputs()))

  const useApiResource = async <T, R = T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options: UseNuxtB10cksApiOptions<T, QueryParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { key, params = {}, ...asyncDataOptions } = options

    return await useAsyncData<T, Error, R | undefined>(
      keyOf(key, 'resource', () => ({ endpoint: toValue(endpoint), params: toValue(params) })),
      query((signal) => api.dataApi.getResource<T>(toValue(endpoint), toValue(params), { signal })),
      asyncDataOptions
    )
  }

  const useApiCollection = async <T, R = T[]>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options: UseNuxtB10cksCollectionOptions<T, QueryParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = false, key, params = {}, ...asyncDataOptions } = options

    return await useAsyncData<T[], Error, R | undefined>(
      keyOf(key, 'collection', () => ({
        allPages,
        endpoint: toValue(endpoint),
        params: toValue(params),
      })),
      query((signal) =>
        api.dataApi.getCollection<T>(toValue(endpoint), toValue(params), { allPages, signal })
      ),
      asyncDataOptions
    )
  }

  /**
   * Answers a failed page request the way a server would: a redirect
   * navigates, a missing entry shows the 404 page. The error is thrown again
   * afterwards, because there is no entry to return.
   */
  const answerRoute = async (error: unknown): Promise<never> => {
    if (error instanceof ContentRedirectError) {
      await navigateTo(error.target, {
        redirectCode: error.status,
        replace: true,
        external: ABSOLUTE_URL.test(error.target),
      })
    } else if (error instanceof ApiError && error.status === 404) {
      // Only the server knows the redirects of paths without an entry, so a client-side
      // navigation asks it once. The full page load renders the 404 if there is none.
      if (
        import.meta.client &&
        !nuxtApp.isHydrating &&
        useRuntimeConfig().public.b10cks.redirects
      ) {
        const router = useRouter()
        reloadNuxtApp({ path: router.resolve(router.currentRoute.value).href, force: true })
        return new Promise<never>(() => {})
      }
      showError({ statusCode: 404, statusMessage: 'Page not found' })
    }
    throw error
  }

  const useContent = async <T = Record<string, unknown>, R = IBContent<T>>(
    fullSlug: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<ContentParams> = {},
    options: UseNuxtB10cksContentOptions<T, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { key, forRoute = false, ...asyncDataOptions } = options

    return await useAsyncData<IBContent<T>, Error, R | undefined>(
      keyOf(key, 'content', () => ({ fullSlug: toValue(fullSlug), params: toValue(params) })),
      query((signal) => {
        const content = api.dataApi.getContent<T>(toValue(fullSlug), toValue(params), { signal })
        return forRoute
          ? content.catch((error: unknown) => nuxtApp.runWithContext(() => answerRoute(error)))
          : content
      }),
      asyncDataOptions
    )
  }

  const useContents = async <T = Record<string, unknown>, R = IBContent<T>[]>(
    params: MaybeRefOrGetter<IBGetContentsParams> = {},
    options: UseNuxtB10cksContentsOptions<T, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBContent<T>[], Error, R | undefined>(
      keyOf(key, 'contents', () => ({ allPages, params: toValue(params) })),
      query((signal) => api.dataApi.getContents<T>(toValue(params), { allPages, signal })),
      asyncDataOptions
    )
  }

  /** The ancestor trail of an entry, root first, addressed by full slug or id. */
  const useBreadcrumb = async <T = Record<string, unknown>, R = IBBreadcrumbLevel<T>[]>(
    slug: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<IBBreadcrumbParams> = {},
    options: UseNuxtB10cksBreadcrumbOptions<T, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { key, ...asyncDataOptions } = options

    return await useAsyncData<IBBreadcrumbLevel<T>[], Error, R | undefined>(
      keyOf(key, 'breadcrumb', () => ({ slug: toValue(slug), params: toValue(params) })),
      query((signal) => api.dataApi.getBreadcrumb<T>(toValue(slug), toValue(params), { signal })),
      asyncDataOptions
    )
  }

  const useBlocks = async <R = IBBlock[]>(
    params: MaybeRefOrGetter<QueryParams> = {},
    options: UseNuxtB10cksCollectionOptions<IBBlock, QueryParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBBlock[], Error, R | undefined>(
      keyOf(key, 'blocks', () => ({ allPages, params: toValue(params) })),
      query((signal) => api.dataApi.getBlocks(toValue(params), { allPages, signal })),
      asyncDataOptions
    )
  }

  const useDataEntries = async <R = IBDataEntry[]>(
    source: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<IBDataEntryParams> = {},
    options: UseNuxtB10cksCollectionOptions<IBDataEntry, QueryParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBDataEntry[], Error, R | undefined>(
      keyOf(key, 'data-entries', () => ({
        allPages,
        source: toValue(source),
        params: toValue(params),
      })),
      query((signal) =>
        api.dataApi.getDataEntries(toValue(source), toValue(params), { allPages, signal })
      ),
      asyncDataOptions
    )
  }

  const useDataSources = async <R = IBDataSource[]>(
    options: UseNuxtB10cksCollectionOptions<IBDataSource, QueryParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = false, key, params = {}, ...asyncDataOptions } = options

    return await useAsyncData<IBDataSource[], Error, R | undefined>(
      keyOf(key, 'data-sources', () => ({ allPages, params: toValue(params) })),
      query((signal) => api.dataApi.getDataSources(toValue(params), { allPages, signal })),
      asyncDataOptions
    )
  }

  const useSitemap = async <R = IBSitemapEntry[]>(
    params: MaybeRefOrGetter<SitemapParams> = {},
    options: UseNuxtB10cksCollectionOptions<IBSitemapEntry, SitemapParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBSitemapEntry[], Error, R | undefined>(
      keyOf(key, 'sitemap', () => ({ allPages, params: toValue(params) })),
      query((signal) => api.dataApi.getSitemap(toValue(params), { allPages, signal })),
      asyncDataOptions
    )
  }

  /** A named sitemap from the space's `settings.sitemaps`, e.g. `news`. */
  const useNamedSitemap = async <R = IBSitemapEntry[]>(
    name: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<SitemapParams> = {},
    options: UseNuxtB10cksCollectionOptions<IBSitemapEntry, SitemapParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBSitemapEntry[], Error, R | undefined>(
      keyOf(key, 'sitemap', () => ({ allPages, name: toValue(name), params: toValue(params) })),
      query((signal) =>
        api.dataApi.getNamedSitemap(toValue(name), toValue(params), { allPages, signal })
      ),
      asyncDataOptions
    )
  }

  const useSpace = async <R = IBSpace>(
    options: UseNuxtB10cksApiOptions<IBSpace, QueryParams, R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { key, params = {}, ...asyncDataOptions } = options

    return await useAsyncData<IBSpace, Error, R | undefined>(
      keyOf(key, 'space', () => ({ params: toValue(params) })),
      query((signal) => api.dataApi.getSpace(toValue(params), { signal })),
      asyncDataOptions
    )
  }

  /**
   * The redirect map, serialised into the page payload. For resolving
   * redirects on every request use the module's `redirects` option, which
   * keeps the list on the server.
   */
  const useRedirects = async <R = RedirectMap>(
    options: UseNuxtB10cksRedirectsOptions<R> = {}
  ): Promise<AwaitedAsyncData<R>> => {
    const { allPages = true, key, params = {}, forceRefresh = false, ...asyncDataOptions } = options

    return await useAsyncData<RedirectMap, Error, R | undefined>(
      keyOf(key, 'redirects', () => ({ allPages, params: toValue(params), forceRefresh })),
      query((signal) =>
        api.dataApi.getRedirects(toValue(params), { allPages, forceRefresh, signal })
      ),
      asyncDataOptions
    )
  }

  /** The `_config` entry. A ref or getter for `params`, e.g. its language, refetches on change. */
  const useB10cksConfig = async <T = Record<string, unknown>>(
    params: MaybeRefOrGetter<Omit<GetConfigOptions, 'signal'>> = {},
    options: AsyncDataConfig<T> = {}
  ): Promise<UseNuxtB10cksConfigResult<T>> => {
    const { key, ...asyncDataOptions } = options

    const asyncData = await useAsyncData<T, Error, T | undefined>(
      keyOf(key, 'config', () => ({ params: toValue(params) })),
      query((signal) => api.dataApi.getConfig<T>({ ...toValue(params), signal })),
      asyncDataOptions
    )

    return Object.assign(asyncData, {
      config: computed(() => asyncData.data.value ?? ({} as T)),
    }) as UseNuxtB10cksConfigResult<T>
  }

  return {
    ...api,
    useApiResource,
    useApiCollection,
    useContent,
    useContents,
    useBreadcrumb,
    useBlocks,
    useDataEntries,
    useDataSources,
    useSpace,
    useSitemap,
    useNamedSitemap,
    useRedirects,
    useB10cksConfig,
    client: api.client,
  }
}

function createAsyncDataKey(scope: string, payload: unknown): string {
  return `b10cks:${scope}:${stableStringify(payload)}`
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const nestedValue = (value as Record<string, unknown>)[key]
        accumulator[key] = sortValue(nestedValue)
        return accumulator
      }, {})
  }

  return value
}
