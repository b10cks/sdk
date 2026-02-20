import { useState } from '#app'
import { ApiClient, createB10cksDataApi, previewBridge } from '@b10cks/client'
import { B10cksClientKey, B10cksDataApiKey, B10cksVue } from '@b10cks/vue'
import { defineNuxtPlugin, useRequestURL, useRuntimeConfig } from 'nuxt/app'

let rv: number | string = 0

export default defineNuxtPlugin({
  name: 'b10cks',
  setup(nuxtApp) {
    const config = useRuntimeConfig()
    const url = useRequestURL()

    // B10cksVue plugin provides directives and registers components
    nuxtApp.vueApp.use(B10cksVue)

    if (previewBridge.isInPreviewMode()) {
      if (import.meta.client) {
        previewBridge.init()
      }
    }

    const rvState = useState<string | number>(
      'b10cks_rv',
      () => url.searchParams.get('b10cks_rv') || url.searchParams.get('rv') || rv
    )
    const b10cksClient = new ApiClient(
      {
        baseUrl: config.public.b10cks.apiUrl || 'https://api.b10cks.com/api',
        token: config.public.b10cks.accessToken,
        fetchClient: $fetch,
        rv: rvState.value,
        getRv: () => {
          return rvState.value
        },
        setRv: (value: string | number) => {
          rv = value
          rvState.value = value
        },
      },
      url
    )
    const b10cksDataApi = createB10cksDataApi(b10cksClient)

    nuxtApp.vueApp.provide(B10cksClientKey, b10cksClient)
    nuxtApp.vueApp.provide(B10cksDataApiKey, b10cksDataApi)

    return {
      provide: {
        b10cksClient,
        b10cksDataApi,
      },
    }
  },
})
