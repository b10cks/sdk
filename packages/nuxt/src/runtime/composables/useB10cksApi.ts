import type { GetConfigOptions } from '@b10cks/client'

import { callOnce } from '#app'
import { useB10cksApi as useVueB10cksApi } from '@b10cks/vue'
import { computed } from 'vue'

type VueB10cksApi = ReturnType<typeof useVueB10cksApi>

export interface NuxtB10cksApi extends VueB10cksApi {
  useB10cksConfig: <T = Record<string, unknown>>(
    params?: GetConfigOptions
  ) => Promise<{ config: import('vue').ComputedRef<T> }>
}

export const useB10cksApi = (): NuxtB10cksApi => {
  const api = useVueB10cksApi()

  callOnce(async () => {
    await api.syncRevision()
  })

  const useB10cksConfig = async <T = Record<string, unknown>>(params: GetConfigOptions = {}) => {
    const state = api.useB10cksConfig<T>(params, { immediate: false })

    if (!state.data.value) {
      await state.execute()
    }

    return {
      config: computed(() => state.config.value),
    }
  }

  return {
    ...api,
    useB10cksConfig,
    client: api.client,
  }
}
