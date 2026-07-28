import { describe, expect, it, vi } from 'vitest'

import { ApiClient, ApiError } from './index'
import type { FetchClient } from './types'

const noopFetch: FetchClient = async () => ({})

const makeClient = (
  overrides: Partial<{
    fetchClient: FetchClient
    rv: string | number
    retries: number
    maxConcurrency: number
  }> = {},
  requestUrl?: string
) =>
  new ApiClient(
    {
      baseUrl: 'https://api.example.com',
      token: 'test-token',
      fetchClient: overrides.fetchClient ?? noopFetch,
      rv: overrides.rv,
      retries: overrides.retries,
      maxConcurrency: overrides.maxConcurrency,
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
  it('throws an ApiError carrying status, endpoint and body when a Response is not ok', async () => {
    const fetchClient = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: 'boom' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        })
    )
    const client = makeClient({ fetchClient })

    const error = await client.get('spaces/me').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(500)
    expect(error.endpoint).toBe('spaces/me')
    expect(error.body).toEqual({ message: 'boom' })
  })

  it('retries transient 5xx responses on GET and eventually succeeds', async () => {
    let calls = 0
    const fetchClient = vi.fn(async () => {
      calls++
      if (calls < 3) return new Response('err', { status: 503 })
      return new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const client = makeClient({ fetchClient, retries: 3 })

    const result = await client.get<{ data: { ok: boolean } }>('spaces/me')
    expect(calls).toBe(3)
    expect(result).toEqual({ data: { ok: true } })
  })

  it('does not retry non-retryable 4xx responses', async () => {
    let calls = 0
    const fetchClient = vi.fn(async () => {
      calls++
      return new Response('nope', { status: 404 })
    })
    const client = makeClient({ fetchClient, retries: 3 })

    await expect(client.get('spaces/me')).rejects.toBeInstanceOf(ApiError)
    expect(calls).toBe(1)
  })

  it('throws when no fetch implementation is available', () => {
    const original = globalThis.fetch
    // @ts-expect-error -- intentionally remove fetch to exercise the guard
    globalThis.fetch = undefined
    try {
      expect(() => new ApiClient({ baseUrl: 'https://api.example.com', token: 't' })).toThrow(
        'No fetch implementation available'
      )
    } finally {
      globalThis.fetch = original
    }
  })
})
