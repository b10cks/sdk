import { ApiClient } from '@b10cks/client'
import { previewBridge, B10cksVue } from '@b10cks/vue'
import { defineNuxtPlugin, useRequestURL, useRuntimeConfig } from 'nuxt/app'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const url = useRequestURL()

  nuxtApp.vueApp.use(B10cksVue)

  if (previewBridge.isInPreviewMode()) {
    if (import.meta.client) {
      previewBridge.init()
    }
  }

  const b10cksClient = new ApiClient({
    baseUrl: config.public.b10cks.apiUrl || 'https://api.b10cks.com/api',
    token: config.public.b10cks.accessToken,
    fetchClient: $fetch
  }, url)

  return {
    provide: {
      b10cksClient
    }
  }
})