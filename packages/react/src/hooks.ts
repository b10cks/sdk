import type {
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useB10cksClient, useB10cksDataApi } from './provider'

type QueryParams = Omit<IBBaseQueryParams, 'token'>
type ContentParams = Omit<IBContentQueryParams, 'token' | 'full_slug'>
type SitemapParams = Omit<IBContentQueryParams, 'token'>

export interface UseB10cksApiOptions<T, P extends QueryParams = QueryParams, R = T> {
  immediate?: boolean
  params?: P
  /** Maps the fetched value. Its return type becomes the type of `data`. */
  transform?: (value: T) => R
}

export interface UseB10cksCollectionOptions<T, P extends QueryParams = QueryParams, R = T>
  extends UseB10cksApiOptions<T, P, R>, Pick<CollectionFetchOptions, 'allPages'> {}

export type UseB10cksContentOptions<T, R = IBContent<T>> = Omit<
  UseB10cksApiOptions<IBContent<T>, QueryParams, R>,
  'params'
>

export interface AsyncState<T> {
  data: T | null
  pending: boolean
  error: Error | null
  /** Fetch now. A newer call, or the component unmounting, aborts it. */
  execute: () => Promise<T>
  refresh: () => Promise<T>
}

export interface UseB10cksConfigResult<T> extends AsyncState<T> {
  config: T
}

/** `R` defaults to `T`, so without a `transform` the value already is the result. */
function applyTransform<T, R>(value: T, transform?: (value: T) => R): R {
  return transform ? transform(value) : (value as unknown as R)
}

/**
 * Hooks for every delivery API query. Once a query has run, a change to its
 * slug, name or params fetches it again.
 */
export function useB10cksApi() {
  const dataApi = useB10cksDataApi()
  const client = useB10cksClient()

  const useApiResource = <T, R = T>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T, QueryParams, R> = {}
  ): AsyncState<R> => {
    const { immediate = true, params = {}, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(await dataApi.getResource<T>(endpoint, params, { signal }), transform),
      [dataApi, endpoint, stableKey(params)],
      immediate
    )
  }

  const useApiCollection = <T, R = T[]>(
    endpoint: Endpoint,
    options: UseB10cksCollectionOptions<T[], QueryParams, R> = {}
  ): AsyncState<R> => {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(
          await dataApi.getCollection<T>(endpoint, params, { allPages, signal }),
          transform
        ),
      [allPages, dataApi, endpoint, stableKey(params)],
      immediate
    )
  }

  const useContent = <T = Record<string, unknown>, R = IBContent<T>>(
    fullSlug: string,
    params: ContentParams = {},
    options: UseB10cksContentOptions<T, R> = {}
  ): AsyncState<R> => {
    const { immediate = true, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(await dataApi.getContent<T>(fullSlug, params, { signal }), transform),
      [dataApi, fullSlug, stableKey(params)],
      immediate
    )
  }

  const useContents = <T = Record<string, unknown>, R = IBContent<T>[]>(
    params: IBGetContentsParams = {},
    options: Omit<UseB10cksCollectionOptions<IBContent<T>[], QueryParams, R>, 'params'> = {}
  ): AsyncState<R> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(await dataApi.getContents<T>(params, { allPages, signal }), transform),
      [allPages, dataApi, stableKey(params)],
      immediate
    )
  }

  /** The ancestor trail of an entry, root first, addressed by full slug or id. */
  const useBreadcrumb = <T = Record<string, unknown>, R = IBBreadcrumbLevel<T>[]>(
    slug: string,
    params: IBBreadcrumbParams = {},
    options: Omit<UseB10cksApiOptions<IBBreadcrumbLevel<T>[], QueryParams, R>, 'params'> = {}
  ): AsyncState<R> => {
    const { immediate = true, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(await dataApi.getBreadcrumb<T>(slug, params, { signal }), transform),
      [dataApi, slug, stableKey(params)],
      immediate
    )
  }

  const useBlocks = <R = IBBlock[]>(
    params: QueryParams = {},
    options: Omit<UseB10cksCollectionOptions<IBBlock[], QueryParams, R>, 'params'> = {}
  ): AsyncState<R> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(await dataApi.getBlocks(params, { allPages, signal }), transform),
      [allPages, dataApi, stableKey(params)],
      immediate
    )
  }

  const useSitemap = <R = IBSitemapEntry[]>(
    params: SitemapParams = {},
    options: Omit<UseB10cksCollectionOptions<IBSitemapEntry[], QueryParams, R>, 'params'> = {}
  ): AsyncState<R> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(await dataApi.getSitemap(params, { allPages, signal }), transform),
      [allPages, dataApi, stableKey(params)],
      immediate
    )
  }

  /** A named sitemap from the space's `settings.sitemaps`, e.g. `news`. */
  const useNamedSitemap = <R = IBSitemapEntry[]>(
    name: string,
    params: SitemapParams = {},
    options: Omit<UseB10cksCollectionOptions<IBSitemapEntry[], QueryParams, R>, 'params'> = {}
  ): AsyncState<R> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(
          await dataApi.getNamedSitemap(name, params, { allPages, signal }),
          transform
        ),
      [allPages, dataApi, name, stableKey(params)],
      immediate
    )
  }

  const useDataEntries = <R = IBDataEntry[]>(
    source: string,
    params: IBDataEntryParams = {},
    options: Omit<UseB10cksCollectionOptions<IBDataEntry[], QueryParams, R>, 'params'> = {}
  ): AsyncState<R> => {
    const { allPages = false, immediate = false, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(
          await dataApi.getDataEntries(source, params, { allPages, signal }),
          transform
        ),
      [allPages, dataApi, stableKey(params), source],
      immediate
    )
  }

  const useDataSources = <R = IBDataSource[]>(
    options: UseB10cksCollectionOptions<IBDataSource[], QueryParams, R> = {}
  ): AsyncState<R> => {
    const { allPages = false, immediate = false, params = {}, transform } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(await dataApi.getDataSources(params, { allPages, signal }), transform),
      [allPages, dataApi, stableKey(params)],
      immediate
    )
  }

  const useSpace = <R = IBSpace>(
    options: UseB10cksApiOptions<IBSpace, QueryParams, R> = {}
  ): AsyncState<R> => {
    const { immediate = true, params = {}, transform } = options
    return useAsyncTask(
      async (signal) => applyTransform(await dataApi.getSpace(params, { signal }), transform),
      [dataApi, stableKey(params)],
      immediate
    )
  }

  const useRedirects = <R = RedirectMap>(
    options: UseB10cksApiOptions<RedirectMap, QueryParams, R> &
      Pick<CollectionFetchOptions, 'allPages'> & { forceRefresh?: boolean } = {}
  ): AsyncState<R> => {
    const {
      allPages = true,
      immediate = true,
      params = {},
      transform,
      forceRefresh = false,
    } = options
    return useAsyncTask(
      async (signal) =>
        applyTransform(
          await dataApi.getRedirects(params, { allPages, forceRefresh, signal }),
          transform
        ),
      [allPages, dataApi, forceRefresh, stableKey(params)],
      immediate
    )
  }

  const useB10cksConfig = <T = Record<string, unknown>>(
    options: Omit<GetConfigOptions, 'signal'> = {},
    executionOptions: { immediate?: boolean } = {}
  ): UseB10cksConfigResult<T> => {
    const { immediate = true } = executionOptions
    const state = useAsyncTask<T>(
      (signal) => dataApi.getConfig<T>({ ...options, signal }),
      [dataApi, stableKey(options)],
      immediate
    )

    return {
      ...state,
      config: state.data ?? ({} as T),
    }
  }

  const syncRevision = (fallbackRv?: number) => dataApi.syncRevision(fallbackRv)

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
    useBreadcrumb,
    useBlocks,
    useSitemap,
    useNamedSitemap,
    useDataEntries,
    useDataSources,
    useSpace,
    useRedirects,
    useB10cksConfig,
    useSyncRevision,
    syncRevision,
    dataApi,
    client,
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

/**
 * State for one query. Each `execute` aborts the request before it, and so does
 * unmounting. Once the query ran, a change to `dependencies` runs it again.
 */
function useAsyncTask<T>(
  task: (signal: AbortSignal) => Promise<T>,
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

  // The latest call; older calls are aborted and leave the state alone.
  const controllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setPending(true)
    setError(null)

    try {
      const value = await taskRef.current(controller.signal)
      if (controllerRef.current === controller) {
        setData(value)
        setPending(false)
      }
      return value
    } catch (caughtError) {
      const normalizedError =
        caughtError instanceof Error
          ? caughtError
          : new Error(`B10cks request failed: ${String(caughtError)}`)
      if (controllerRef.current === controller) {
        setError(normalizedError)
        setPending(false)
      }
      throw normalizedError
    }
  }, dependencies)

  useEffect(() => {
    if (immediate || controllerRef.current) {
      // The error is already captured in state; swallow the rethrow so the
      // background fetch does not surface as an unhandled promise rejection.
      void execute().catch(() => {})
    }
  }, [execute, immediate])

  useEffect(
    () => () => {
      controllerRef.current?.abort()
      controllerRef.current = null
    },
    []
  )

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
