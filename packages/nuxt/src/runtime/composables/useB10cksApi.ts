import type {
  Endpoint,
  GetConfigOptions,
  IBBaseQueryParams,
  IBBlock,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataSource,
  IBSitemapEntry,
  IBSpace,
  RedirectMap,
} from '@b10cks/client'
import type { AsyncDataOptions } from 'nuxt/app'

import { callOnce, useAsyncData } from '#app'
import { useB10cksApi as useVueB10cksApi } from '@b10cks/vue'
import { computed } from 'vue'

type VueB10cksApi = ReturnType<typeof useVueB10cksApi>
type QueryParams = Omit<IBBaseQueryParams, 'token'>

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

type AsyncDataConfig<T> = Omit<AsyncDataOptions<T, T>, 'default' | 'transform' | 'watch'> & {
  key?: string
}

type AsyncDataCollectionConfig<T> = Omit<
  AsyncDataOptions<T[], T[]>,
  'default' | 'transform' | 'watch'
> & {
  key?: string
}

export type UseNuxtB10cksConfigResult<T> = AwaitedAsyncData<T> & {
  config: import('vue').ComputedRef<T>
}

export type UseNuxtB10cksApiOptions<T, P extends QueryParams = QueryParams> = AsyncDataConfig<T> & {
  params?: P
  transform?: (value: T) => T
}

export type UseNuxtB10cksCollectionOptions<
  T,
  P extends QueryParams = QueryParams,
> = AsyncDataCollectionConfig<T> & {
  allPages?: boolean
  params?: P
  transform?: (value: T[]) => T[]
}

export type UseNuxtB10cksContentOptions<T> = AsyncDataConfig<IBContent<T>> & {
  transform?: (value: IBContent<T>) => IBContent<T>
}

export type UseNuxtB10cksContentsOptions<T> = UseNuxtB10cksCollectionOptions<
  IBContent<T>,
  Omit<IBContentQueryParams, 'token'>
>

export type UseNuxtB10cksRedirectsOptions = AsyncDataConfig<RedirectMap> & {
  allPages?: boolean
  params?: QueryParams
  transform?: (value: RedirectMap) => RedirectMap
  forceRefresh?: boolean
}

export type NuxtB10cksApi = Omit<
  VueB10cksApi,
  | 'useApiResource'
  | 'useApiCollection'
  | 'useContent'
  | 'useContents'
  | 'useBlocks'
  | 'useDataEntries'
  | 'useDataSources'
  | 'useSitemap'
  | 'useSpace'
  | 'useRedirects'
  | 'useB10cksConfig'
> & {
  useApiResource: <T>(
    endpoint: Endpoint,
    options?: UseNuxtB10cksApiOptions<T>
  ) => Promise<AwaitedAsyncData<T>>
  useApiCollection: <T>(
    endpoint: Endpoint,
    options?: UseNuxtB10cksCollectionOptions<T>
  ) => Promise<AwaitedCollectionAsyncData<T>>
  useContent: <T = Record<string, unknown>>(
    fullSlug: string,
    params?: Omit<IBContentQueryParams, 'token' | 'full_slug'>,
    options?: UseNuxtB10cksContentOptions<T>
  ) => Promise<AwaitedContentAsyncData<T>>
  useContents: <T = Record<string, unknown>>(
    params?: Omit<IBContentQueryParams, 'token'>,
    options?: UseNuxtB10cksContentsOptions<T>
  ) => Promise<AwaitedContentsAsyncData<T>>
  useBlocks: (
    params?: QueryParams,
    options?: UseNuxtB10cksCollectionOptions<IBBlock>
  ) => Promise<AwaitedCollectionAsyncData<IBBlock>>
  useDataEntries: (
    source: string,
    params?: QueryParams,
    options?: UseNuxtB10cksCollectionOptions<IBDataEntry>
  ) => Promise<AwaitedCollectionAsyncData<IBDataEntry>>
  useDataSources: (
    options?: UseNuxtB10cksCollectionOptions<IBDataSource>
  ) => Promise<AwaitedCollectionAsyncData<IBDataSource>>
  useSitemap: (
    params?: Omit<IBContentQueryParams, 'token'>,
    options?: UseNuxtB10cksCollectionOptions<IBSitemapEntry, Omit<IBContentQueryParams, 'token'>>
  ) => Promise<AwaitedCollectionAsyncData<IBSitemapEntry>>
  useSpace: (options?: UseNuxtB10cksApiOptions<IBSpace>) => Promise<AwaitedAsyncData<IBSpace>>
  useRedirects: (options?: UseNuxtB10cksRedirectsOptions) => Promise<AwaitedAsyncData<RedirectMap>>
  useB10cksConfig: <T = Record<string, unknown>>(
    params?: GetConfigOptions,
    options?: AsyncDataConfig<T>
  ) => Promise<UseNuxtB10cksConfigResult<T>>
}

export const useB10cksApi = (): NuxtB10cksApi => {
  const api = useVueB10cksApi()

  callOnce(async () => {
    await api.syncRevision()
  })

  const useApiResource = async <T>(
    endpoint: Endpoint,
    options: UseNuxtB10cksApiOptions<T> = {}
  ): Promise<AwaitedAsyncData<T>> => {
    const { key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<T | undefined, Error>(
      key ?? createAsyncDataKey('resource', { endpoint, params }),
      async () => {
        const value = await api.dataApi.getResource<T>(endpoint, params)
        return transform ? transform(value) : value
      },
      asyncDataOptions
    )
  }

  const useApiCollection = async <T>(
    endpoint: Endpoint,
    options: UseNuxtB10cksCollectionOptions<T> = {}
  ): Promise<AwaitedCollectionAsyncData<T>> => {
    const { allPages = false, key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<T[] | undefined, Error>(
      key ?? createAsyncDataKey('collection', { allPages, endpoint, params }),
      async () => {
        const value = await api.dataApi.getCollection<T>(endpoint, params, { allPages })
        return transform ? transform(value) : value
      },
      asyncDataOptions
    )
  }

  const useContent = async <T = Record<string, unknown>>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {},
    options: UseNuxtB10cksContentOptions<T> = {}
  ): Promise<AwaitedContentAsyncData<T>> => {
    const { key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBContent<T> | undefined, Error>(
      key ?? createAsyncDataKey('content', { fullSlug, params }),
      async () => {
        const value = await api.dataApi.getContent<T>(fullSlug, params)
        return transform ? transform(value) : value
      },
      asyncDataOptions
    )
  }

  const useContents = async <T = Record<string, unknown>>(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: UseNuxtB10cksContentsOptions<T> = {}
  ): Promise<AwaitedContentsAsyncData<T>> => {
    const { allPages = false, key, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBContent<T>[] | undefined, Error>(
      key ?? createAsyncDataKey('contents', { allPages, params }),
      async () => {
        const value = await api.dataApi.getContents<T>(params, { allPages })
        return transform ? transform(value) : value
      },
      asyncDataOptions
    )
  }

  const useBlocks = async (
    params: QueryParams = {},
    options: UseNuxtB10cksCollectionOptions<IBBlock> = {}
  ): Promise<AwaitedCollectionAsyncData<IBBlock>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBBlock[] | undefined, Error>(
      key ?? createAsyncDataKey('blocks', { allPages, params }),
      () => api.dataApi.getBlocks(params, { allPages }),
      asyncDataOptions
    )
  }

  const useDataEntries = async (
    source: string,
    params: QueryParams = {},
    options: UseNuxtB10cksCollectionOptions<IBDataEntry> = {}
  ): Promise<AwaitedCollectionAsyncData<IBDataEntry>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBDataEntry[] | undefined, Error>(
      key ?? createAsyncDataKey('data-entries', { allPages, source, params }),
      () => api.dataApi.getDataEntries(source, params, { allPages }),
      asyncDataOptions
    )
  }

  const useDataSources = async (
    options: UseNuxtB10cksCollectionOptions<IBDataSource> = {}
  ): Promise<AwaitedCollectionAsyncData<IBDataSource>> => {
    const { allPages = false, key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBDataSource[] | undefined, Error>(
      key ?? createAsyncDataKey('data-sources', { allPages, params }),
      async () => {
        const value = await api.dataApi.getDataSources(params, { allPages })
        return transform ? transform(value) : value
      },
      asyncDataOptions
    )
  }

  const useSitemap = async (
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: UseNuxtB10cksCollectionOptions<IBSitemapEntry, Omit<IBContentQueryParams, 'token'>> = {}
  ): Promise<AwaitedCollectionAsyncData<IBSitemapEntry>> => {
    const { allPages = false, key, ...asyncDataOptions } = options

    return await useAsyncData<IBSitemapEntry[] | undefined, Error>(
      key ?? createAsyncDataKey('sitemap', { allPages, params }),
      () => api.dataApi.getSitemap(params, { allPages }),
      asyncDataOptions
    )
  }

  const useSpace = async (
    options: UseNuxtB10cksApiOptions<IBSpace> = {}
  ): Promise<AwaitedAsyncData<IBSpace>> => {
    const { key, params = {}, transform, ...asyncDataOptions } = options

    return await useAsyncData<IBSpace | undefined, Error>(
      key ?? createAsyncDataKey('space', { params }),
      async () => {
        const value = await api.dataApi.getSpace(params)
        return transform ? transform(value) : value
      },
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
      key ?? createAsyncDataKey('redirects', { allPages, params, forceRefresh }),
      async () => {
        const value = await api.dataApi.getRedirects(params, { allPages, forceRefresh })
        return transform ? transform(value) : value
      },
      asyncDataOptions
    )
  }

  const useB10cksConfig = async <T = Record<string, unknown>>(
    params: GetConfigOptions = {},
    options: AsyncDataConfig<T> = {}
  ): Promise<UseNuxtB10cksConfigResult<T>> => {
    const { key, ...asyncDataOptions } = options

    const asyncData = await useAsyncData<T | undefined, Error>(
      key ?? createAsyncDataKey('config', { params }),
      () => api.dataApi.getConfig<T>(params),
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
    useBlocks,
    useDataEntries,
    useDataSources,
    useSpace,
    useSitemap,
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
