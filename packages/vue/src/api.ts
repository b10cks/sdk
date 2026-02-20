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
  RedirectMap,
  IBSpace,
} from '@b10cks/client'

import { computed, inject, ref, type Ref } from 'vue'

import { B10cksClientKey, B10cksDataApiKey } from './types'

type QueryParams = Omit<IBBaseQueryParams, 'token'>

export interface UseB10cksApiOptions<T, P extends QueryParams = QueryParams> {
  immediate?: boolean
  params?: P
  transform?: (value: T) => T
}

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
    options: UseB10cksApiOptions<T[], QueryParams> = {}
  ): AsyncState<T[]> {
    const { immediate = false, params = {}, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getCollection<T>(endpoint, params)
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
    options: Omit<UseB10cksApiOptions<IBContent<T>[]>, 'params'> = {}
  ): AsyncState<IBContent<T>[]> => {
    const { immediate = false, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getContents<T>(params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useBlocks = (
    params: QueryParams = {},
    options: Omit<UseB10cksApiOptions<IBBlock[]>, 'params'> = {}
  ): AsyncState<IBBlock[]> => {
    const { immediate = false, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getBlocks(params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useDataEntries = (
    source: string,
    params: QueryParams = {},
    options: Omit<UseB10cksApiOptions<IBDataEntry[]>, 'params'> = {}
  ): AsyncState<IBDataEntry[]> => {
    const { immediate = false, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getDataEntries(source, params)
      return transform ? transform(value) : value
    }, immediate)
  }

  const useDataSources = (
    options: UseB10cksApiOptions<IBDataSource[]> = {}
  ): AsyncState<IBDataSource[]> => {
    const { immediate = false, params = {}, transform } = options
    return createAsyncState(async () => {
      const value = await dataApi.getDataSources(params)
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
    options: UseB10cksApiOptions<RedirectMap> & { forceRefresh?: boolean } = {}
  ): AsyncState<RedirectMap> => {
    const { immediate = true, params = {}, transform, forceRefresh = false } = options
    return createAsyncState(async () => {
      const value = await dataApi.getRedirects(params, forceRefresh)
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
