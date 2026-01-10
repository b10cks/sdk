import type {
  Endpoint,
  IBBaseQueryParams,
  IBBlock,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataSource,
  IBRedirect,
  IBResponse,
  IBSpace,
} from '@b10cks/client'
import { computed, ref } from 'vue'
import { useNuxtApp, useState } from '#app'

export interface UseB10cksApiOptions<T> {
  immediate?: boolean
  params?: Omit<IBBaseQueryParams, 'token'>
  transform?: (data: IBResponse<T>) => T
}

interface UseB10cksApiReturn {
  useContent: <T = never>(
    full_slug: string,
    params?: Omit<IBContentQueryParams, 'token' | 'full_slug'>,
    options?: Omit<UseB10cksApiOptions<IBContent<T>>, 'params'>
  ) => {
    data: import('vue').Ref<IBContent<T> | null>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useContents: <T = never>(
    params?: Omit<IBContentQueryParams, 'token'>,
    options?: Omit<UseB10cksApiOptions<IBContent<T>[]>, 'params'>
  ) => {
    data: import('vue').Ref<IBContent<T>[]>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useBlocks: (
    params?: Omit<IBBaseQueryParams, 'token'>,
    options?: Omit<UseB10cksApiOptions<IBBlock[]>, 'params'>
  ) => {
    data: import('vue').Ref<IBBlock[]>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useDataEntries: (
    source: string,
    params?: Omit<IBBaseQueryParams, 'token'>,
    options?: Omit<UseB10cksApiOptions<IBDataEntry[]>, 'params'>
  ) => {
    data: import('vue').Ref<IBDataEntry[]>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useDataSources: (options?: UseB10cksApiOptions<IBDataSource[]>) => {
    data: import('vue').Ref<IBDataSource[]>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useSpace: (options?: UseB10cksApiOptions<IBSpace>) => {
    data: import('vue').Ref<IBSpace>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useRedirects: (options?: UseB10cksApiOptions<Record<string, { target: string; status_code: number }>>) => {
    data: import('vue').Ref<Record<string, { target: string; status_code: number }> | null>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useApiResource: <T = never>(
    endpoint: Endpoint,
    options?: UseB10cksApiOptions<T>
  ) => {
    data: import('vue').Ref<any>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useApiCollection: <T = never>(
    endpoint: Endpoint,
    options?: UseB10cksApiOptions<T[]>
  ) => {
    data: import('vue').Ref<any>
    pending: import('vue').Ref<boolean>
    error: import('vue').Ref<Error | null>
    execute: () => Promise<any>
    refresh: () => Promise<any>
  }
  useB10cksConfig: <T>(params?: { slug?: string } & IBContentQueryParams) => Promise<{
    config: import('vue').ComputedRef<T>
  }>
  client: any
}

export const useB10cksApi = (): UseB10cksApiReturn => {
  const { $b10cksClient } = useNuxtApp()

  function useApiResource<T = never>(endpoint: Endpoint, options: UseB10cksApiOptions<T> = {}) {
    const { immediate = true, params = {}, transform } = options
    const pending = ref(false)
    const data = ref<T | null>(null)
    const error = ref<Error | null>(null)

    const execute = async () => {
      pending.value = true
      error.value = null

      try {
        const result = await $b10cksClient.get(endpoint, params)
        data.value = transform ? transform(result) : result
        return data.value
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err))
        throw error.value
      } finally {
        pending.value = false
      }
    }

    if (immediate) {
      // biome-ignore lint/suspicious/noConsole: intentional
      execute().catch((err) => console.error(`Error fetching ${endpoint}:`, err))
    }

    return {
      data,
      pending,
      error,
      execute,
      refresh: execute,
    }
  }

  function useApiCollection<T = never>(endpoint: Endpoint, options: UseB10cksApiOptions<T[]> = {}) {
    const { immediate = false, params = {} } = options
    const pending = ref(false)
    const data = ref<T[] | null>(null)
    const error = ref<Error | null>(null)

    const execute = async () => {
      pending.value = true
      error.value = null

      try {
        data.value = await $b10cksClient.getAll<T>(endpoint, params)
        return data.value
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err))
        throw error.value
      } finally {
        pending.value = false
      }
    }

    if (immediate) {
      // biome-ignore lint/suspicious/noConsole: intentional
      execute().catch((err) => console.error(`Error fetching ${endpoint}:`, err))
    }

    return {
      data,
      pending,
      error,
      execute,
      refresh: execute,
    }
  }

  const useContent = <T = never>(
    full_slug: string,
    params: Omit<IBContentQueryParams, 'token' | 'full_slug'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>>, 'params'> = {}
  ) => {
    return useApiResource<IBContent<T>>(`contents/${full_slug}`, {
      ...options,
      params: params,
      transform: (result: IBResponse<IBContent<T>>): IBContent<T> => {
        if ('data' in result) {
          return result.data
        }
        return result
      },
    })
  }

  const useContents = <T = never>(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>[]>, 'params'> = {}
  ) => {
    return useApiCollection<IBContent<T>>('contents', {
      ...options,
      params,
    })
  }

  const useBlocks = (
    params: Omit<IBBaseQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBBlock[]>, 'params'> = {}
  ) => {
    return useApiCollection<IBBlock>('blocks', {
      ...options,
      params,
    })
  }

  const useDataEntries = (
    source: string,
    params: Omit<IBBaseQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBDataEntry[]>, 'params'> = {}
  ) => {
    return useApiCollection<IBDataEntry>(`datasources/${source}/entries`, {
      ...options,
      params,
    })
  }

  const useDataSources = (options: UseB10cksApiOptions<IBDataSource[]> = {}) => {
    return useApiCollection<IBDataSource>('datasources', options)
  }

  const useSpace = (options: UseB10cksApiOptions<IBSpace> = {}) => {
    return useApiResource<IBSpace>('spaces/me', {
      ...options,
      transform: (result: IBResponse<IBSpace>): IBSpace => {
        if ('data' in result) {
          return result.data
        }
        return result
      },
    })
  }

  const cache = useState<IBRedirect[]>('redirects')

  const useRedirects = (options: UseB10cksApiOptions<IBRedirect[]> = {}) => {
    const { immediate = true, params = {} } = options
    const pending = ref(false)
    const data = ref<IBRedirect[] | null>(cache.value || null)
    const error = ref<Error | null>(null)

    const execute = async () => {
      if (cache.value) {
        return cache.value
      }
      pending.value = true
      error.value = null

      try {
        const results = (await $b10cksClient.getAll('redirects' as Endpoint, params)) as IBRedirect[]
        const transformed = Object.fromEntries(
          results.map(({ source, target, status_code }) => [source, { target, status_code }])
        )
        data.value = transformed
        cache.value = transformed
        return transformed
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err))
        throw error.value
      } finally {
        pending.value = false
      }
    }

    if (immediate && !cache.value) {
      // biome-ignore lint/suspicious/noConsole: intentional
      execute().catch((err) => console.error('Error fetching redirects:', err))
    }

    return {
      data,
      pending,
      error,
      execute,
      refresh: execute,
    }
  }

  const configCache = useState('config')

  const useB10cksConfig = async <T>({
    slug = '_config',
    version,
    language,
    ...params
  }: { slug?: string } & IBContentQueryParams = {}) => {
    const options = {
      params: {
        ...params,
        version,
        vid: null,
        language,
        token: $b10cksClient.token,
      },
    }
    const { data: config, execute } = useContent(slug, options.params, { immediate: false })

    if (!configCache.value) {
      await execute()
      configCache.value = config.value?.content || {}
    }

    return {
      config: computed(() => configCache.value) as T,
    }
  }

  return {
    useContent,
    useContents,
    useBlocks,
    useDataEntries,
    useDataSources,
    useSpace,
    useRedirects,
    useApiResource,
    useApiCollection,
    useB10cksConfig,
    client: $b10cksClient,
  }
}
