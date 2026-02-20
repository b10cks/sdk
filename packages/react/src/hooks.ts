import type {
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

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useB10cksDataApi } from './provider'

type QueryParams = Omit<IBBaseQueryParams, 'token'>

export interface UseB10cksApiOptions<T, P extends QueryParams = QueryParams> {
  immediate?: boolean
  params?: P
  transform?: (value: T) => T
}

export interface AsyncState<T> {
  data: T | null
  pending: boolean
  error: Error | null
  execute: () => Promise<T>
  refresh: () => Promise<T>
}

export interface UseB10cksConfigResult<T> extends AsyncState<T> {
  config: T
}

export function useB10cksApi() {
  const dataApi = useB10cksDataApi()

  const useApiResource = <T>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T> = {}
  ): AsyncState<T> => {
    const { immediate = true, params = {}, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getResource<T>(endpoint, params)
        return transform ? transform(value) : value
      },
      [dataApi, endpoint, params, transform],
      immediate
    )
  }

  const useApiCollection = <T>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T[], QueryParams> = {}
  ): AsyncState<T[]> => {
    const { immediate = false, params = {}, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getCollection<T>(endpoint, params)
        return transform ? transform(value) : value
      },
      [dataApi, endpoint, params, transform],
      immediate
    )
  }

  const useContent = <T = Record<string, unknown>>(
    fullSlug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>>, 'params'> = {}
  ): AsyncState<IBContent<T>> => {
    const { immediate = true, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getContent<T>(fullSlug, params)
        return transform ? transform(value) : value
      },
      [dataApi, fullSlug, params, transform],
      immediate
    )
  }

  const useContents = <T = Record<string, unknown>>(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>[]>, 'params'> = {}
  ): AsyncState<IBContent<T>[]> => {
    const { immediate = false, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getContents<T>(params)
        return transform ? transform(value) : value
      },
      [dataApi, params, transform],
      immediate
    )
  }

  const useBlocks = (
    params: QueryParams = {},
    options: Omit<UseB10cksApiOptions<IBBlock[]>, 'params'> = {}
  ): AsyncState<IBBlock[]> => {
    const { immediate = false, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getBlocks(params)
        return transform ? transform(value) : value
      },
      [dataApi, params, transform],
      immediate
    )
  }

  const useDataEntries = (
    source: string,
    params: QueryParams = {},
    options: Omit<UseB10cksApiOptions<IBDataEntry[]>, 'params'> = {}
  ): AsyncState<IBDataEntry[]> => {
    const { immediate = false, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getDataEntries(source, params)
        return transform ? transform(value) : value
      },
      [dataApi, source, params, transform],
      immediate
    )
  }

  const useDataSources = (
    options: UseB10cksApiOptions<IBDataSource[]> = {}
  ): AsyncState<IBDataSource[]> => {
    const { immediate = false, params = {}, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getDataSources(params)
        return transform ? transform(value) : value
      },
      [dataApi, params, transform],
      immediate
    )
  }

  const useSpace = (options: UseB10cksApiOptions<IBSpace> = {}): AsyncState<IBSpace> => {
    const { immediate = true, params = {}, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getSpace(params)
        return transform ? transform(value) : value
      },
      [dataApi, params, transform],
      immediate
    )
  }

  const useRedirects = (
    options: UseB10cksApiOptions<RedirectMap> & { forceRefresh?: boolean } = {}
  ): AsyncState<RedirectMap> => {
    const { immediate = true, params = {}, transform, forceRefresh = false } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getRedirects(params, forceRefresh)
        return transform ? transform(value) : value
      },
      [dataApi, params, transform, forceRefresh],
      immediate
    )
  }

  const useB10cksConfig = <T = Record<string, unknown>>(
    options: GetConfigOptions = {},
    executionOptions: { immediate?: boolean } = {}
  ): UseB10cksConfigResult<T> => {
    const { immediate = true } = executionOptions
    const state = useAsyncTask<T>(
      () => dataApi.getConfig<T>(options),
      [dataApi, options],
      immediate
    )

    return {
      ...state,
      config: state.data ?? ({} as T),
    }
  }

  const useSyncRevision = (fallbackRv?: number) => {
    useEffect(() => {
      void dataApi.syncRevision(fallbackRv)
    }, [dataApi, fallbackRv])
  }

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
    useSyncRevision,
    dataApi,
  }
}

function useAsyncTask<T>(
  task: () => Promise<T>,
  dependencies: unknown[],
  immediate: boolean
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setPending(true)
    setError(null)

    try {
      const value = await task()
      setData(value)
      return value
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error(`B10cks request failed: ${String(caughtError)}`)
      setError(normalizedError)
      throw normalizedError
    } finally {
      setPending(false)
    }
  }, dependencies)

  useEffect(() => {
    if (immediate) {
      void execute()
    }
  }, [execute, immediate])

  return useMemo(
    () => ({
      data,
      pending,
      error,
      execute,
      refresh: execute,
    }),
    [data, pending, error, execute]
  )
}
