import { describe, expect, it, vi } from 'vitest'

import type { FetchClient } from './types'

import { ApiClient } from './index'

const noopFetch: FetchClient = async () => ({})

const makeClient = (
  overrides: Partial<{ fetchClient: FetchClient; rv: string | number }> = {},
  requestUrl?: string
) =>
  new ApiClient(
    {
      baseUrl: 'https://api.example.com',
      token: 'test-token',
      fetchClient: overrides.fetchClient ?? noopFetch,
      rv: overrides.rv,
    },
    requestUrl
  )

describe('ApiClient revision handling', () => {
  it('does not leak the revision between instances (SSR-safe)', () => {
    const a = makeClient()
    a.setRv(999)

    // A fresh instance with no revision source must start clean. With a
    // module-level singleton this would inherit `999` from instance `a`.
    const b = makeClient()

    expect(a.getRv()).toBe(999)
    expect(b.getRv()).toBe(0)
  })

  it('reads the initial revision from the b10cks_rv query param', () => {
    const client = makeClient({}, 'https://app.example.com/page?b10cks_rv=88')
    expect(client.getRv()).toBe('88')
  })

  it('falls back to options.rv when no query param is present', () => {
    const client = makeClient({ rv: 55 })
    expect(client.getRv()).toBe(55)
  })

  it('prefers the query param over options.rv', () => {
    const client = makeClient({ rv: 55 }, 'https://app.example.com/?b10cks_rv=88')
    expect(client.getRv()).toBe('88')
  })

  it('delegates revision storage to getRv/setRv when provided', () => {
    let stored: string | number = 0
    const client = new ApiClient({
      baseUrl: 'https://api.example.com',
      token: 'test-token',
      fetchClient: noopFetch,
      getRv: () => stored,
      setRv: (value) => {
        stored = value
      },
    })

    client.setRv(7)

    expect(stored).toBe(7)
    expect(client.getRv()).toBe(7)
  })

  it('updates the revision from a response envelope', async () => {
    const fetchClient = vi.fn(async () => ({ data: { id: 'x' }, rv: 314 }))
    const client = makeClient({ fetchClient })

    await client.get('spaces/me')

    expect(client.getRv()).toBe(314)
  })
})

describe('ApiClient error handling', () => {
  it('throws with the status code when a fetch Response is not ok', async () => {
    const fetchClient = vi.fn(async () => new Response('nope', { status: 500 }))
    const client = makeClient({ fetchClient })

    await expect(client.get('spaces/me')).rejects.toThrow('Request failed with status 500')
  })

  it('throws when no fetch implementation is available', () => {
    const original = globalThis.fetch
    // @ts-expect-error -- intentionally remove fetch to exercise the guard
    globalThis.fetch = undefined
    try {
      expect(
        () => new ApiClient({ baseUrl: 'https://api.example.com', token: 't' })
      ).toThrow('No fetch implementation available')
    } finally {
      globalThis.fetch = original
    }
  })
})
