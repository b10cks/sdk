import type {
  B10cksDataApi,
  CollectionFetchOptions,
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
import {
  computed,
  getCurrentScope,
  inject,
  type MaybeRefOrGetter,
  onScopeDispose,
  ref,
  type Ref,
  toValue,
  watch,
} from 'vue'

import { B10cksClientKey, B10cksDataApiKey } from './types'

type QueryParams = Omit<IBBaseQueryParams, 'token'>

export interface UseB10cksApiOptions<T, P extends QueryParams = QueryParams> {
  immediate?: boolean
  /** Query params. A ref or getter refetches when they change. */
  params?: MaybeRefOrGetter<P>
  transform?: (value: T) => T
}

export interface UseB10cksCollectionOptions<T, P extends QueryParams = QueryParams>
  extends UseB10cksApiOptions<T, P>, Pick<CollectionFetchOptions, 'allPages'> {}

export interface AsyncState<T> {
  data: import('vue').Ref<T | null>
  pending: import('vue').Ref<boolean>
  error: import('vue').Ref<Error | null>
  /** Fetch now. A newer call, or the owning component unmounting, aborts it. */
  execute: () => Promise<T>
  refresh: () => Promise<T>
}

export interface UseB10cksConfigResult<T> extends AsyncState<T> {
  config: import('vue').ComputedRef<T>
}

export function useB10cksDataApi(): B10cksDataApi {
  const dataApi = inject(B10cksDataApiKey, null)
  if (!dataApi) {
    throw new Error(
      'B10cks data API was not found in Vue injection context. Install B10cksVue with API options or provide B10cksDataApiKey manually.'
    )
  }

  return dataApi
}

export function useB10cksClient() {
  return inject(B10cksClientKey, null)
}

/**
 * Every composable accepts refs or getters for its slug, name and params. Once
 * a query has run, a change to them refetches it.
 */
export function useB10cksApi() {
  const dataApi = useB10cksDataApi()
  const client = useB10cksClient()

  function useApiResource<T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options: UseB10cksApiOptions<T> = {}
  ): AsyncState<T> {
    const { immediate = true, params = {}, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getResource<T>(toValue(endpoint), toValue(params), { signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => [toValue(endpoint), toValue(params)]
    )
  }

  function useApiCollection<T>(
    endpoint: MaybeRefOrGetter<Endpoint>,
    options: UseB10cksCollectionOptions<T[], QueryParams> = {}
  ): AsyncState<T[]> {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getCollection<T>(toValue(endpoint), toValue(params), {
          allPages,
          signal,
        })
        return transform ? transform(value) : value
      },
      immediate,
      () => [toValue(endpoint), toValue(params)]
    )
  }

  const useContent = <T = Record<string, unknown>>(
    fullSlug: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token' | 'full_slug'>> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>>, 'params'> = {}
  ): AsyncState<IBContent<T>> => {
    const { immediate = true, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getContent<T>(toValue(fullSlug), toValue(params), { signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => [toValue(fullSlug), toValue(params)]
    )
  }

  const useContents = <T = Record<string, unknown>>(
    params: MaybeRefOrGetter<IBGetContentsParams> = {},
    options: Omit<UseB10cksCollectionOptions<IBContent<T>[]>, 'params'> = {}
  ): AsyncState<IBContent<T>[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getContents<T>(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => toValue(params)
    )
  }

  /** The ancestor trail of an entry, root first, addressed by full slug or id. */
  const useBreadcrumb = <T = Record<string, unknown>>(
    slug: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<IBBreadcrumbParams> = {},
    options: Omit<UseB10cksApiOptions<IBBreadcrumbLevel<T>[]>, 'params'> = {}
  ): AsyncState<IBBreadcrumbLevel<T>[]> => {
    const { immediate = true, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getBreadcrumb<T>(toValue(slug), toValue(params), { signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => [toValue(slug), toValue(params)]
    )
  }

  const useSitemap = (
    params: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token'>> = {},
    options: Omit<UseB10cksCollectionOptions<IBSitemapEntry[]>, 'params'> = {}
  ): AsyncState<IBSitemapEntry[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getSitemap(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => toValue(params)
    )
  }

  /** A named sitemap from the space's `settings.sitemaps`, e.g. `news`. */
  const useNamedSitemap = (
    name: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<Omit<IBContentQueryParams, 'token'>> = {},
    options: Omit<UseB10cksCollectionOptions<IBSitemapEntry[]>, 'params'> = {}
  ): AsyncState<IBSitemapEntry[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getNamedSitemap(toValue(name), toValue(params), {
          allPages,
          signal,
        })
        return transform ? transform(value) : value
      },
      immediate,
      () => [toValue(name), toValue(params)]
    )
  }

  const useBlocks = (
    params: MaybeRefOrGetter<QueryParams> = {},
    options: Omit<UseB10cksCollectionOptions<IBBlock[]>, 'params'> = {}
  ): AsyncState<IBBlock[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getBlocks(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => toValue(params)
    )
  }

  const useDataEntries = (
    source: MaybeRefOrGetter<string>,
    params: MaybeRefOrGetter<IBDataEntryParams> = {},
    options: Omit<UseB10cksCollectionOptions<IBDataEntry[]>, 'params'> = {}
  ): AsyncState<IBDataEntry[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getDataEntries(toValue(source), toValue(params), {
          allPages,
          signal,
        })
        return transform ? transform(value) : value
      },
      immediate,
      () => [toValue(source), toValue(params)]
    )
  }

  const useDataSources = (
    options: UseB10cksCollectionOptions<IBDataSource[]> = {}
  ): AsyncState<IBDataSource[]> => {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getDataSources(toValue(params), { allPages, signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => toValue(params)
    )
  }

  const useSpace = (options: UseB10cksApiOptions<IBSpace> = {}): AsyncState<IBSpace> => {
    const { immediate = true, params = {}, transform } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getSpace(toValue(params), { signal })
        return transform ? transform(value) : value
      },
      immediate,
      () => toValue(params)
    )
  }

  const useRedirects = (
    options: UseB10cksApiOptions<RedirectMap> &
      Pick<CollectionFetchOptions, 'allPages'> & { forceRefresh?: boolean } = {}
  ): AsyncState<RedirectMap> => {
    const {
      allPages = false,
      immediate = true,
      params = {},
      transform,
      forceRefresh = false,
    } = options
    return createAsyncState(
      async (signal) => {
        const value = await dataApi.getRedirects(toValue(params), {
          allPages,
          forceRefresh,
          signal,
        })
        return transform ? transform(value) : value
      },
      immediate,
      () => toValue(params)
    )
  }

  const useB10cksConfig = <T = Record<string, unknown>>(
    options: MaybeRefOrGetter<Omit<GetConfigOptions, 'signal'>> = {},
    executionOptions: { immediate?: boolean } = {}
  ): UseB10cksConfigResult<T> => {
    const { immediate = true } = executionOptions
    const state = createAsyncState<T>(
      (signal) => dataApi.getConfig<T>({ ...toValue(options), signal }),
      immediate,
      () => toValue(options)
    )

    return {
      ...state,
      config: computed(() => state.data.value ?? ({} as T)),
    }
  }

  const syncRevision = async (fallbackRv?: number) => dataApi.syncRevision(fallbackRv)

  return {
    useApiResource,
    useApiCollection,
    useContent,
    useContents,
    useBreadcrumb,
    useSitemap,
    useNamedSitemap,
    useBlocks,
    useDataEntries,
    useDataSources,
    useSpace,
    useRedirects,
    useB10cksConfig,
    syncRevision,
    dataApi,
    client,
  }
}

/**
 * State for one query. Each `execute` aborts the request before it, and so
 * does disposing the owning scope. `inputs` lists the query's reactive inputs:
 * once the query ran, a change to them runs it again.
 */
function createAsyncState<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  immediate: boolean,
  inputs: () => unknown
): AsyncState<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const pending = ref(false)
  const error = ref<Error | null>(null)
  // The latest call; older calls are aborted and leave the state alone.
  let controller: AbortController | null = null

  const execute = async (): Promise<T> => {
    controller?.abort()
    const current = new AbortController()
    controller = current
    pending.value = true
    error.value = null

    try {
      const value = await fetcher(current.signal)
      if (controller === current) {
        data.value = value
        pending.value = false
      }
      return value
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error(`B10cks request failed: ${String(caughtError)}`)
      if (controller === current) {
        error.value = normalizedError
        pending.value = false
      }
      throw normalizedError
    }
  }

  // The error is already captured in `error`; swallow the rethrow so a
  // background fetch does not surface as an unhandled promise rejection.
  const run = () => void execute().catch(() => {})

  watch(
    () => JSON.stringify(inputs()),
    () => {
      if (controller) run()
    }
  )
  if (getCurrentScope()) {
    onScopeDispose(() => controller?.abort())
  }

  // Skip the auto-fetch on the server: it is fire-and-forget, so its result can
  // never reach the rendered output — only a wasted upstream request. SSR data
  // fetching should await `execute()` (or use the Nuxt composables).
  if (immediate && typeof window !== 'undefined') {
    run()
  }

  return {
    data,
    pending,
    error,
    execute,
    refresh: execute,
  }
}
