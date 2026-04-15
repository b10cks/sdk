import type {
  B10cksDataApi,
  CollectionFetchOptions,
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

import { computed, inject, ref, type Ref } from 'vue'

import { B10cksClientKey, B10cksDataApiKey } from './types'

type QueryParams = Omit<IBBaseQueryParams, 'token'>

export interface UseB10cksApiOptions<T, P extends QueryParams = QueryParams> {
  immediate?: boolean
  params?: P
  transform?: (value: T) => T
}

export interface UseB10cksCollectionOptions<T, P extends QueryParams = QueryParams>
  extends UseB10cksApiOptions<T, P>,
    CollectionFetchOptions {}

export interface AsyncState<T> {
  data: import('vue').Ref<T | null>
  pending: import('vue').Ref<boolean>
  error: import('vue').Ref<Error | null>
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

export function useB10cksApi() {
  const dataApi = useB10cksDataApi()
  const client = useB10cksClient()

  function useApiResource<T>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T> = {}
  ): AsyncState<T> {
    const { immediate = true, params = {}, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getResource<T>(endpoint, params)
      return transform ? transform(value) : value
    }, immediate)
  }

  function useApiCollection<T>(
    endpoint: Endpoint,
    options: UseB10cksCollectionOptions<T[], QueryParams> = {}
  ): AsyncState<T[]> {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getCollection<T>(endpoint, params, { allPages })
      return transform ? transform(value) : value
    }, immediate)
  }

  const useContent = <T = Record<string, unknown>>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>>, 'params'> = {}
  ): AsyncState<IBContent<T>> => {
    const { immediate = true, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getContent<T>(fullSlug, params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useContents = <T = Record<string, unknown>>(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksCollectionOptions<IBContent<T>[]>, 'params'> = {}
  ): AsyncState<IBContent<T>[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getContents<T>(params, { allPages })
      return transform ? transform(value) : value
    }, immediate)
  }

  const useSitemap = (
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksCollectionOptions<IBSitemapEntry[]>, 'params'> = {}
  ): AsyncState<IBSitemapEntry[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getSitemap(params, { allPages })
      return transform ? transform(value) : value
    }, immediate)
  }

  const useBlocks = (
    params: QueryParams = {},
    options: Omit<UseB10cksCollectionOptions<IBBlock[]>, 'params'> = {}
  ): AsyncState<IBBlock[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getBlocks(params, { allPages })
      return transform ? transform(value) : value
    }, immediate)
  }

  const useDataEntries = (
    source: string,
    params: QueryParams = {},
    options: Omit<UseB10cksCollectionOptions<IBDataEntry[]>, 'params'> = {}
  ): AsyncState<IBDataEntry[]> => {
    const { allPages = false, immediate = false, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getDataEntries(source, params, { allPages })
      return transform ? transform(value) : value
    }, immediate)
  }

  const useDataSources = (
    options: UseB10cksCollectionOptions<IBDataSource[]> = {}
  ): AsyncState<IBDataSource[]> => {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getDataSources(params, { allPages })
      return transform ? transform(value) : value
    }, immediate)
  }

  const useSpace = (options: UseB10cksApiOptions<IBSpace> = {}): AsyncState<IBSpace> => {
    const { immediate = true, params = {}, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getSpace(params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useRedirects = (
    options: UseB10cksApiOptions<RedirectMap> & CollectionFetchOptions & { forceRefresh?: boolean } = {}
  ): AsyncState<RedirectMap> => {
    const { allPages = false, immediate = true, params = {}, transform, forceRefresh = false } = options
    return createAsyncState(async () => {
      const value = await dataApi.getRedirects(params, { allPages, forceRefresh })
      return transform ? transform(value) : value
    }, immediate)
  }

  const useB10cksConfig = <T = Record<string, unknown>>(
    options: GetConfigOptions = {},
    executionOptions: { immediate?: boolean } = {}
  ): UseB10cksConfigResult<T> => {
    const { immediate = true } = executionOptions
    const state = createAsyncState<T>(() => dataApi.getConfig<T>(options), immediate)

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
    useSitemap,
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

function createAsyncState<T>(fetcher: () => Promise<T>, immediate: boolean): AsyncState<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const pending = ref(false)
  const error = ref<Error | null>(null)

  const execute = async (): Promise<T> => {
    pending.value = true
    error.value = null

    try {
      const value = await fetcher()
      data.value = value
      return value
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error(`B10cks request failed: ${String(caughtError)}`)
      error.value = normalizedError
      throw normalizedError
    } finally {
      pending.value = false
    }
  }

  if (immediate) {
    void execute()
  }

  return {
    data,
    pending,
    error,
    execute,
    refresh: execute,
  }
}
