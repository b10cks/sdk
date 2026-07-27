import type {
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useB10cksDataApi } from './provider'

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
      [dataApi, endpoint, stableKey(params)],
      immediate
    )
  }

  const useApiCollection = <T>(
    endpoint: Endpoint,
    options: UseB10cksCollectionOptions<T[], QueryParams> = {}
  ): AsyncState<T[]> => {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getCollection<T>(endpoint, params, { allPages })
        return transform ? transform(value) : value
      },
      [allPages, dataApi, endpoint, stableKey(params)],
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
      [dataApi, fullSlug, stableKey(params)],
      immediate
    )
  }

  const useContents = <T = Record<string, unknown>>(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksCollectionOptions<IBContent<T>[]>, 'params'> = {}
  ): AsyncState<IBContent<T>[]> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getContents<T>(params, { allPages })
        return transform ? transform(value) : value
      },
      [allPages, dataApi, stableKey(params)],
      immediate
    )
  }

  const useBlocks = (
    params: QueryParams = {},
    options: Omit<UseB10cksCollectionOptions<IBBlock[]>, 'params'> = {}
  ): AsyncState<IBBlock[]> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getBlocks(params, { allPages })
        return transform ? transform(value) : value
      },
      [allPages, dataApi, stableKey(params)],
      immediate
    )
  }

  const useSitemap = (
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksCollectionOptions<IBSitemapEntry[]>, 'params'> = {}
  ): AsyncState<IBSitemapEntry[]> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getSitemap(params, { allPages })
        return transform ? transform(value) : value
      },
      [allPages, dataApi, stableKey(params)],
      immediate
    )
  }

  const useDataEntries = (
    source: string,
    params: QueryParams = {},
    options: Omit<UseB10cksCollectionOptions<IBDataEntry[]>, 'params'> = {}
  ): AsyncState<IBDataEntry[]> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getDataEntries(source, params, { allPages })
        return transform ? transform(value) : value
      },
      [allPages, dataApi, stableKey(params), source],
      immediate
    )
  }

  const useDataSources = (
    options: UseB10cksCollectionOptions<IBDataSource[]> = {}
  ): AsyncState<IBDataSource[]> => {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getDataSources(params, { allPages })
        return transform ? transform(value) : value
      },
      [allPages, dataApi, stableKey(params)],
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
      [dataApi, stableKey(params)],
      immediate
    )
  }

  const useRedirects = (
    options: UseB10cksApiOptions<RedirectMap> & CollectionFetchOptions & { forceRefresh?: boolean } = {}
  ): AsyncState<RedirectMap> => {
    const { allPages = false, immediate = true, params = {}, transform, forceRefresh = false } = options
    return useAsyncTask(
      async () => {
        const value = await dataApi.getRedirects(params, { allPages, forceRefresh })
        return transform ? transform(value) : value
      },
      [allPages, dataApi, forceRefresh, stableKey(params)],
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
      [dataApi, stableKey(options)],
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
    useSitemap,
    useDataEntries,
    useDataSources,
    useSpace,
    useRedirects,
    useB10cksConfig,
    useSyncRevision,
    dataApi,
  }
}

/**
 * Serializes params/options for use in hook dependency arrays, so a fresh
 * (but structurally equal) object created on each render does not re-trigger
 * the immediate fetch effect.
 */
function stableKey(value: unknown): string {
  return JSON.stringify(value) ?? ''
}

function useAsyncTask<T>(
  task: () => Promise<T>,
  dependencies: unknown[],
  immediate: boolean
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // The task closure (params, transform) is read through a ref so `execute`
  // always sees the latest values without them being identity dependencies.
  const taskRef = useRef(task)
  taskRef.current = task

  // Monotonic call id so an older in-flight request cannot overwrite the state
  // of a newer one — the latest `execute` call wins.
  const callIdRef = useRef(0)

  const execute = useCallback(async () => {
    const id = ++callIdRef.current
    setPending(true)
    setError(null)

    try {
      const value = await taskRef.current()
      if (id === callIdRef.current) {
        setData(value)
        setPending(false)
      }
      return value
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error(`B10cks request failed: ${String(caughtError)}`)
      if (id === callIdRef.current) {
        setError(normalizedError)
        setPending(false)
      }
      throw normalizedError
    }
  }, dependencies)

  useEffect(() => {
    if (immediate) {
      // The error is already captured in state; swallow the rethrow so the
      // immediate fetch does not surface as an unhandled promise rejection.
      void execute().catch(() => {})
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
