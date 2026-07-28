import type { FetchClient } from '@b10cks/client'
// ApiClient/createB10cksDataApi are imported directly from @b10cks/client (a
// direct dependency) so the emitted module type can name them portably.
import { ApiClient, createB10cksDataApi } from '@b10cks/client'
import { B10cksClientKey, B10cksDataApiKey, B10cksVue } from '@b10cks/vue'
import { defineNuxtPlugin, useRequestURL, useRuntimeConfig } from 'nuxt/app'
import type { InjectionKey } from 'vue'

import { useState } from '#app'

// In this monorepo @b10cks/client is reachable both as source (this package's
// resolution) and as built types (via @b10cks/vue's published d.ts). The two
// copies are structurally identical but nominally distinct because of private
// fields, so the injection keys and the instances disagree at `provide`. This
// helper lets us cast the runtime-correct instance to the key's value type.
type InjectedValue<K> = K extends InjectionKey<infer V> ? V : never

export default defineNuxtPlugin({
  name: 'b10cks',
  setup(nuxtApp) {
    const config = useRuntimeConfig()
    const url = useRequestURL()

    // B10cksVue plugin provides directives, registers components, and (in
    // preview mode) initializes the bridge, injects styles, and applies the
    // scroll offset.
    nuxtApp.vueApp.use(B10cksVue, {
      scrollOffset: config.public.b10cks.scrollOffset,
      allowedOrigins: config.public.b10cks.allowedOrigins,
    })

    const rvState = useState<string | number>(
      'b10cks_rv',
      () => url.searchParams.get('b10cks_rv') || url.searchParams.get('rv') || 0
    )
    const b10cksClient = new ApiClient(
      {
        baseUrl: config.public.b10cks.apiUrl || 'https://api.b10cks.com/api',
        token: config.public.b10cks.accessToken,
        // $fetch auto-parses the response body; the client handles a non-Response
        // payload by passing it through. Its init type (NitroFetchOptions) is
        // wider than RequestInit, so the cast is required.
        fetchClient: $fetch as unknown as FetchClient,
        rv: rvState.value,
        getRv: () => {
          return rvState.value
        },
        setRv: (value: string | number) => {
          rvState.value = value
        },
      },
      url
    )
    const b10cksDataApi = createB10cksDataApi(b10cksClient)

    nuxtApp.vueApp.provide(
      B10cksClientKey,
      b10cksClient as unknown as InjectedValue<typeof B10cksClientKey>
    )
    nuxtApp.vueApp.provide(
      B10cksDataApiKey,
      b10cksDataApi as unknown as InjectedValue<typeof B10cksDataApiKey>
    )

    return {
      provide: {
        b10cksClient,
        b10cksDataApi,
      },
    }
  },
})
