import { computed, ref, type Ref } from 'vue'
import type {
  IBBaseQueryParams,
  IBBlock,
  IBContent,
  IBContentQueryParams,
  IBDataEntry,
  IBDataSource,
  IBSpace
} from '@b10cks/client'
import type { Endpoint } from '@b10cks/client'
import { useNuxtApp } from '#app'

export interface UseB10cksApiOptions<T> {
  immediate?: boolean;
  params?: Omit<IBBaseQueryParams, 'token'>;
  transform?: (data: unknown) => T;
}

export const useB10cksApi = () => {
  const { $b10cksClient } = useNuxtApp()

  function useApiResource<T = never>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T> = {}
  ) {
    const { immediate = true, params = {}, transform } = options
    const pending = ref(false)
    const data: Ref<T | null> = ref(null)
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
      execute().catch(err => console.error(`Error fetching ${endpoint}:`, err))
    }

    return {
      data: computed(() => data.value),
      pending,
      error,
      execute,
      refresh: execute,
    }
  }

  function useApiCollection<T = never>(
    endpoint: Endpoint,
    options: UseB10cksApiOptions<T[]> = {}
  ) {
    const { immediate = false, params = {}, transform } = options
    const pending = ref(false)
    const data: Ref<T[] | null> = ref(null)
    const error = ref<Error | null>(null)

    const execute = async () => {
      pending.value = true
      error.value = null

      try {
        const results = await $b10cksClient.getAll<T>(endpoint, params)
        data.value = transform ? transform(results) : results
        return data.value
      } catch (err) {
        error.value = err instanceof Error ? err : new Error(String(err))
        throw error.value
      } finally {
        pending.value = false
      }
    }

    if (immediate) {
      execute().catch(err => console.error(`Error fetching ${endpoint}:`, err))
    }

    return {
      data: computed(() => data.value),
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
    return useApiResource<IBContent<T>>(
      `contents/${full_slug}`,
      {
        ...options,
        params: params,
        transform: (result) => {
          if ('data' in result) {
            return result.data
          }
          return result
        },
      }
    )
  }

  const useContents = <T = never>(
    params: Omit<IBContentQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBContent<T>[]>, 'params'> = {}
  ) => {
    return useApiCollection<IBContent<T>>(
      'contents',
      {
        ...options,
        params,
      }
    )
  }

  const useBlocks = (
    params: Omit<IBBaseQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBBlock[]>, 'params'> = {}
  ) => {
    return useApiCollection<IBBlock>(
      'blocks',
      {
        ...options,
        params,
      }
    )
  }

  const useDataEntries = (
    source: string,
    params: Omit<IBBaseQueryParams, 'token'> = {},
    options: Omit<UseB10cksApiOptions<IBDataEntry[]>, 'params'> = {}
  ) => {
    return useApiCollection<IBDataEntry>(
      `datasources/${source}/entries`,
      {
        ...options,
        params,
      }
    )
  }

  const useDataSources = (
    options: UseB10cksApiOptions<IBDataSource[]> = {}
  ) => {
    return useApiCollection<IBDataSource>(
      'datasources',
      options
    )
  }

  const useSpace = (
    options: UseB10cksApiOptions<IBSpace> = {}
  ) => {
    return useApiResource<IBSpace>(
      'spaces/me',
      {
        ...options,
        transform: (result) => {
          if ('data' in result) {
            return result.data
          }
          return result
        },
      }
    )
  }

  return {
    useContent,
    useContents,
    useBlocks,
    useDataEntries,
    useDataSources,
    useSpace,
    useApiResource,
    useApiCollection,
    client: $b10cksClient,
  }
}
