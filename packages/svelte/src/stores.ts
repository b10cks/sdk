import type {
  B10cksDataApi,
  Endpoint,
  GetConfigOptions,
  IBBaseQueryParams,
  IBBlock,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataSource,
  IBSpace,
  RedirectMap,
} from '@b10cks/client'

import { writable, type Readable } from 'svelte/store'

import { getB10cksDataApi } from './context'

type QueryParams = Omit<IBBaseQueryParams, 'token'>

export type AsyncState<T> = {
  data: T | null
  pending: boolean
  error: Error | null
}

export type AsyncStore<T> = Readable<AsyncState<T>> & {
  execute: () => Promise<T>
  refresh: () => Promise<T>
}

export interface UseB10cksApiOptions<T, P extends QueryParams = QueryParams> {
  immediate?: boolean
  params?: P
  transform?: (value: T) => T
}

export function createB10cksStores(dataApi: B10cksDataApi = getB10cksDataApi()) {
  const useApiResource = <T>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T> = {}
  ): AsyncStore<T> => {
    const { immediate = true, params = {}, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getResource<T>(endpoint, params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useApiCollection = <T>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T[], QueryParams> = {}
  ): AsyncStore<T[]> => {
    const { immediate = false, params = {}, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getCollection<T>(endpoint, params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useContent = <T = Record<string, unknown>>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>>, 'params'> = {}
  ): AsyncStore<IBContent<T>> => {
    const { immediate = true, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getContent<T>(fullSlug, params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useContents = <T = Record<string, unknown>>(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>[]>, 'params'> = {}
  ): AsyncStore<IBContent<T>[]> => {
    const { immediate = false, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getContents<T>(params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useBlocks = (
    params: QueryParams = {},
    options: Omit<UseB10cksApiOptions<IBBlock[]>, 'params'> = {}
  ): AsyncStore<IBBlock[]> => {
    const { immediate = false, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getBlocks(params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useDataEntries = (
    source: string,
    params: QueryParams = {},
    options: Omit<UseB10cksApiOptions<IBDataEntry[]>, 'params'> = {}
  ): AsyncStore<IBDataEntry[]> => {
    const { immediate = false, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getDataEntries(source, params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useDataSources = (
    options: UseB10cksApiOptions<IBDataSource[]> = {}
  ): AsyncStore<IBDataSource[]> => {
    const { immediate = false, params = {}, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getDataSources(params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useSpace = (options: UseB10cksApiOptions<IBSpace> = {}): AsyncStore<IBSpace> => {
    const { immediate = true, params = {}, transform } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getSpace(params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useRedirects = (
    options: UseB10cksApiOptions<RedirectMap> & { forceRefresh?: boolean } = {}
  ): AsyncStore<RedirectMap> => {
    const { immediate = true, params = {}, transform, forceRefresh = false } = options
    return createAsyncStore(async () => {
      const value = await dataApi.getRedirects(params, forceRefresh)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useB10cksConfig = <T = Record<string, unknown>>(
    options: GetConfigOptions = {},
    executionOptions: { immediate?: boolean } = {}
  ): AsyncStore<T> => {
    const { immediate = true } = executionOptions
    return createAsyncStore(() => dataApi.getConfig<T>(options), immediate)
  }

  const syncRevision = async (fallbackRv?: number) => dataApi.syncRevision(fallbackRv)

  return {
    useApiResource,
    useApiCollection,
    useContent,
    useContents,
    useBlocks,
    useDataEntries,
    useDataSources,
    useSpace,
    useRedirects,
    useB10cksConfig,
    syncRevision,
    dataApi,
  }
}

function createAsyncStore<T>(task: () => Promise<T>, immediate: boolean): AsyncStore<T> {
  const store = writable<AsyncState<T>>({
    data: null,
    pending: false,
    error: null,
  })

  const execute = async () => {
    store.update((state) => ({ ...state, pending: true, error: null }))

    try {
      const value = await task()
      store.set({ data: value, pending: false, error: null })
      return value
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error(`B10cks request failed: ${String(caughtError)}`)
      store.update((state) => ({ ...state, pending: false, error: normalizedError }))
      throw normalizedError
    }
  }

  if (immediate) {
    void execute()
  }

  return {
    subscribe: store.subscribe,
    execute,
    refresh: execute,
  }
}
