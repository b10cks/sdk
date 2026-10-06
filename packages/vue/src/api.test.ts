// @vitest-environment happy-dom
import { createB10cksDataApi, type DataApiClient, type RequestOptions } from '@b10cks/client'
import { describe, expect, it } from 'vitest'
import { createApp, nextTick, ref } from 'vue'

import { type AsyncState, useB10cksApi } from './api'
import { B10cksDataApiKey } from './types'

describe('useB10cksApi', () => {
  it('refetches when a ref input changes and aborts the request it replaces', async () => {
    const signals: AbortSignal[] = []
    const client: DataApiClient = {
      get: <T>(endpoint: string, _params?: unknown, options?: RequestOptions) => {
        if (options?.signal) signals.push(options.signal)
        // The first request never settles on its own.
        if (endpoint === 'contents/first') return new Promise<T>(() => {})
        return Promise.resolve({ data: { slug: endpoint } } as T)
      },
      getAll: async () => [],
      setRv: () => {},
    }
    const slug = ref('first')
    let state: AsyncState<unknown> | undefined
    const app = createApp({
      setup() {
        state = useB10cksApi().useContent(slug)
        return () => null
      },
    })
    app.provide(B10cksDataApiKey, createB10cksDataApi(client))
    app.mount(document.createElement('div'))

    slug.value = 'second'
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve))

    expect(signals.map((signal) => signal.aborted)).toEqual([true, false])
    expect(state?.data.value).toEqual({ slug: 'contents/second' })
    app.unmount()
  })
})
