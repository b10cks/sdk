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
import { useB10cksApi as useVueB10cksApi } from '@b10cks/vue'
import type { AsyncDataOptions } from 'nuxt/app'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import { callOnce, useAsyncData } from '#app'

type VueB10cksApi = ReturnType<typeof useVueB10cksApi>
// `sort` is omitted because content params widen it to `string | ContentSortItem[]`,
// which is incompatible with the base `sort?: string`. Concrete param types (e.g.
// IBGetContentsParams) re-add their own `sort`.
type QueryParams = Omit<IBBaseQueryParams, 'token' | 'sort'>

type AwaitedAsyncData<T> = Awaited<ReturnType<typeof useAsyncData<T | undefined, Error>>>
type AwaitedCollectionAsyncData<T> = Awaited<
  ReturnType<typeof useAsyncData<T[] | undefined, Error>>
>
type AwaitedContentAsyncData<T> = Awaited<
  ReturnType<typeof useAsyncData<IBContent<T> | undefined, Error>>
>
type AwaitedContentsAsyncData<T> = Awaited<
  ReturnType<typeof useAsyncData<IBContent<T>[] | undefined, Error>>
>

/**
 * Without `key`, the key derives from the query's inputs and follows them when
 * they are refs or getters. A custom key should do the same, e.g. a getter.
 */
type AsyncDataConfig<T> = Omit<AsyncDataOptions<T, T>, 'default' | 'transform' | 'watch'> & {
  key?: MaybeRefOrGetter<string>
}

type AsyncDataCollectionConfig<T> = Omit<
  AsyncDataOptions<T[], T[]>,
  'default' | 'transform' | 'watch'
> & {
  key?: MaybeRefOrGetter<string>
}

export type UseNuxtB10cksConfigResult<T> = AwaitedAsyncData<T> & {
  config: import('vue').ComputedRef<T>
}

export type UseNuxtB10cksApiOptions<T, P extends QueryParams = QueryParams> = AsyncDataConfig<T> & {
  params?: MaybeRefOrGetter<P>
  transform?: (value: T) => T
}

export type UseNuxtB10cksCollectionOptions<
  T,
  P extends QueryParams = QueryParams,
> = AsyncDataCollectionConfig<T> & {
  allPages?: boolean
  params?: MaybeRefOrGetter<P>
  transform?: (value: T[]) => T[]
}

export type UseNuxtB10cksContentOptions<T> = AsyncDataConfig<IBContent<T>> & {
  transform?: (value: IBContent<T>) => IBContent<T>
}

export type UseNuxtB10cksContentsOptions<T> = UseNuxtB10cksCollectionOptions<
  IBContent<T>,
  IBGetContentsParams
>

export type UseNuxtB10cksBreadcrumbOptions<T> = AsyncDataCollectionConfig<IBBreadcrumbLevel<T>> & {
  transform?: (value: IBBreadcrumbLevel<T>[]) => IBBreadcrumbLevel<T>[]
}

export type UseNuxtB10cksRedirectsOptions = AsyncDataConfig<RedirectMap> & {
  allPages?: boolean
  params?: MaybeRefOrGetter<QueryParams>
  transform?: (value: RedirectMap) => RedirectMap
  forceRefresh?: boolean
}

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
  useApiResource: <T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options?: UseNuxtB10cksApiOptions<T>
  ) => Promise<AwaitedAsyncData<T>>
  useApiCollection: <T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options?: UseNuxtB10cksCollectionOptions<T>
  ) => Promise<AwaitedCollectionAsyncData<T>>
  useContent: <T = Record<string, unknown>>(
    fullSlug: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token' | 'full_slug'>>,
    options?: UseNuxtB10cksContentOptions<T>
  ) => Promise<AwaitedContentAsyncData<T>>
  useContents: <T = Record<string, unknown>>(
    params?: MaybeRefOrGetter<IBGetContentsParams>,
    options?: UseNuxtB10cksContentsOptions<T>
  ) => Promise<AwaitedContentsAsyncData<T>>
  useBreadcrumb: <T = Record<string, unknown>>(
    slug: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<IBBreadcrumbParams>,
    options?: UseNuxtB10cksBreadcrumbOptions<T>
  ) => Promise<AwaitedCollectionAsyncData<IBBreadcrumbLevel<T>>>
  useBlocks: (
    params?: MaybeRefOrGetter<QueryParams>,
    options?: UseNuxtB10cksCollectionOptions<IBBlock>
  ) => Promise<AwaitedCollectionAsyncData<IBBlock>>
  useDataEntries: (
    source: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<IBDataEntryParams>,
    options?: UseNuxtB10cksCollectionOptions<IBDataEntry>
  ) => Promise<AwaitedCollectionAsyncData<IBDataEntry>>
  useDataSources: (
    options?: UseNuxtB10cksCollectionOptions<IBDataSource>
  ) => Promise<AwaitedCollectionAsyncData<IBDataSource>>
  useSitemap: (
    params?: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token'>>,
    options?: UseNuxtB10cksCollectionOptions<IBSitemapEntry, Omit<IBContentQueryParams, 'token'>>
  ) => Promise<AwaitedCollectionAsyncData<IBSitemapEntry>>
  useNamedSitemap: (
    name: MaybeRefOrGetter<string>,
    params?: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token'>>,
    options?: UseNuxtB10cksCollectionOptions<IBSitemapEntry, Omit<IBContentQueryParams, 'token'>>
  ) => Promise<AwaitedCollectionAsyncData<IBSitemapEntry>>
  useSpace: (options?: UseNuxtB10cksApiOptions<IBSpace>) => Promise<AwaitedAsyncData<IBSpace>>
  useRedirects: (options?: UseNuxtB10cksRedirectsOptions) => Promise<AwaitedAsyncData<RedirectMap>>
  useB10cksConfig: <T = Record<string, unknown>>(
    params?: MaybeRefOrGetter<Omit<GetConfigOptions, 'signal'>>,
    options?: AsyncDataConfig<T>
  ) => Promise<UseNuxtB10cksConfigResult<T>>
}

/** `callOnce` key of the revision sync, shared by every `useB10cksApi` call. */
const REVISION_KEY = 'b10cks:sync-revision'

/**
 * Data composables backed by `useAsyncData`. Slugs, names and params accept
 * refs or getters: the default async-data key follows them, so a change
 * fetches the new query. Requests are cancelled when Nuxt aborts the handler.
 */
export const useB10cksApi = (): NuxtB10cksApi => {
  const api = useVueB10cksApi()

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

  const useApiResource = async <T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options: UseNuxtB10cksApiOptions<T> = {}
  ): Promise<AwaitedAsyncData<T>> => {
    const { key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<T | undefined, Error>(
      keyOf(key, 'resource', () => ({ endpoint: toValue(endpoint), params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getResource<T>(toValue(endpoint), toValue(params), {
          signal,
        })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useApiCollection = async <T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options: UseNuxtB10cksCollectionOptions<T> = {}
  ): Promise<AwaitedCollectionAsyncData<T>> => {
    const { allPages = false, key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<T[] | undefined, Error>(
      keyOf(key, 'collection', () => ({
        allPages,
        endpoint: toValue(endpoint),
        params: toValue(params),
      })),
      query(async (signal) => {
        const value = await api.dataApi.getCollection<T>(toValue(endpoint), toValue(params), {
          allPages,
          signal,
        })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useContent = async <T = Record<string, unknown>>(
    fullSlug: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token' | 'full_slug'>> = {},
    options: UseNuxtB10cksContentOptions<T> = {}
  ): Promise<AwaitedContentAsyncData<T>> => {
    const { key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBContent<T> | undefined, Error>(
      keyOf(key, 'content', () => ({ fullSlug: toValue(fullSlug), params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getContent<T>(toValue(fullSlug), toValue(params), {
          signal,
        })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useContents = async <T = Record<string, unknown>>(
    params: MaybeRefOrGetter<IBGetContentsParams> = {},
    options: UseNuxtB10cksContentsOptions<T> = {}
  ): Promise<AwaitedContentsAsyncData<T>> => {
    const { allPages = false, key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBContent<T>[] | undefined, Error>(
      keyOf(key, 'contents', () => ({ allPages, params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getContents<T>(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  /** The ancestor trail of an entry, root first, addressed by full slug or id. */
  const useBreadcrumb = async <T = Record<string, unknown>>(
    slug: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<IBBreadcrumbParams> = {},
    options: UseNuxtB10cksBreadcrumbOptions<T> = {}
  ): Promise<AwaitedCollectionAsyncData<IBBreadcrumbLevel<T>>> => {
    const { key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBBreadcrumbLevel<T>[] | undefined, Error>(
      keyOf(key, 'breadcrumb', () => ({ slug: toValue(slug), params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getBreadcrumb<T>(toValue(slug), toValue(params), {
          signal,
        })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useBlocks = async (
    params: MaybeRefOrGetter<QueryParams> = {},
    options: UseNuxtB10cksCollectionOptions<IBBlock> = {}
  ): Promise<AwaitedCollectionAsyncData<IBBlock>> => {
    const { allPages = false, key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBBlock[] | undefined, Error>(
      keyOf(key, 'blocks', () => ({ allPages, params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getBlocks(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useDataEntries = async (
    source: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<IBDataEntryParams> = {},
    options: UseNuxtB10cksCollectionOptions<IBDataEntry> = {}
  ): Promise<AwaitedCollectionAsyncData<IBDataEntry>> => {
    const { allPages = false, key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBDataEntry[] | undefined, Error>(
      keyOf(key, 'data-entries', () => ({
        allPages,
        source: toValue(source),
        params: toValue(params),
      })),
      query(async (signal) => {
        const value = await api.dataApi.getDataEntries(toValue(source), toValue(params), {
          allPages,
          signal,
        })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useDataSources = async (
    options: UseNuxtB10cksCollectionOptions<IBDataSource> = {}
  ): Promise<AwaitedCollectionAsyncData<IBDataSource>> => {
    const { allPages = false, key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBDataSource[] | undefined, Error>(
      keyOf(key, 'data-sources', () => ({ allPages, params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getDataSources(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useSitemap = async (
    params: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token'>> = {},
    options: UseNuxtB10cksCollectionOptions<
      IBSitemapEntry,
      Omit<IBContentQueryParams, 'token'>
    > = {}
  ): Promise<AwaitedCollectionAsyncData<IBSitemapEntry>> => {
    const { allPages = false, key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBSitemapEntry[] | undefined, Error>(
      keyOf(key, 'sitemap', () => ({ allPages, params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getSitemap(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  /** A named sitemap from the space's `settings.sitemaps`, e.g. `news`. */
  const useNamedSitemap = async (
    name: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token'>> = {},
    options: UseNuxtB10cksCollectionOptions<
      IBSitemapEntry,
      Omit<IBContentQueryParams, 'token'>
    > = {}
  ): Promise<AwaitedCollectionAsyncData<IBSitemapEntry>> => {
    const { allPages = false, key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBSitemapEntry[] | undefined, Error>(
      keyOf(key, 'sitemap', () => ({ allPages, name: toValue(name), params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getNamedSitemap(toValue(name), toValue(params), {
          allPages,
          signal,
        })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useSpace = async (
    options: UseNuxtB10cksApiOptions<IBSpace> = {}
  ): Promise<AwaitedAsyncData<IBSpace>> => {
    const { key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBSpace | undefined, Error>(
      keyOf(key, 'space', () => ({ params: toValue(params) })),
      query(async (signal) => {
        const value = await api.dataApi.getSpace(toValue(params), { signal })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  const useRedirects = async (
    options: UseNuxtB10cksRedirectsOptions = {}
  ): Promise<AwaitedAsyncData<RedirectMap>> => {
    const {
      allPages = false,
      key,
      params = {},
      transform,
      forceRefresh = false,
      ...asyncDataOptions
    } = options

    return await useAsyncData<RedirectMap | undefined, Error>(
      keyOf(key, 'redirects', () => ({ allPages, params: toValue(params), forceRefresh })),
      query(async (signal) => {
        const value = await api.dataApi.getRedirects(toValue(params), {
          allPages,
          forceRefresh,
          signal,
        })
        return transform ? transform(value) : value
      }),
      asyncDataOptions
    )
  }

  /** The `_config` entry. A ref or getter for `params`, e.g. its language, refetches on change. */
  const useB10cksConfig = async <T = Record<string, unknown>>(
    params: MaybeRefOrGetter<Omit<GetConfigOptions, 'signal'>> = {},
    options: AsyncDataConfig<T> = {}
  ): Promise<UseNuxtB10cksConfigResult<T>> => {
    const { key, ...asyncDataOptions } = options

    const asyncData = await useAsyncData<T | undefined, Error>(
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
