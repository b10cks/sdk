import { ApiClient } from '@b10cks/client'
import { B10cksVue, previewBridge } from '@b10cks/vue'
import { defineNuxtPlugin, useRequestURL, useRuntimeConfig } from 'nuxt/app'
import { useState } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const url = useRequestURL()

  nuxtApp.vueApp.use(B10cksVue)

  if (previewBridge.isInPreviewMode()) {
    if (import.meta.client) {
      previewBridge.init()
    }
  }

  const rvState = useState<string | number>('b10cks_rv', () => 0)

  const b10cksClient = new ApiClient(
    {
      baseUrl: config.public.b10cks.apiUrl || 'https://api.b10cks.com/api',
      token: config.public.b10cks.accessToken,
      fetchClient: $fetch,
      getRv: () => rvState.value,
      setRv: (value: string | number) => {
        rvState.value = value
      },
    },
    url
  )

  return {
    provide: {
      b10cksClient,
    },
  }
})
