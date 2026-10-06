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

describe('ApiClient request limits', () => {
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: { 'content-type': 'application/json', ...init.headers },
    })

  it('times out while reading the body, without the token in the error', async () => {
    const fetchClient: FetchClient = async () => ({
      ok: true,
      status: 200,
      json: () => new Promise(() => {}),
    })
    const client = new ApiClient({
      baseUrl: 'https://api.example.com',
      token: 'secret-token',
      fetchClient,
      timeoutMs: 20,
    })

    const error = await client.get('spaces/me').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(0)
    expect(error.endpoint).toBe('spaces/me')
    expect(error.message).not.toContain('secret-token')
  })

  it('stops on the caller signal, also while waiting to retry', async () => {
    const controller = new AbortController()
    const fetchClient = vi.fn(async () => {
      setTimeout(() => controller.abort(new Error('left the page')))
      return new Response('down', { status: 503 })
    })
    const client = makeClient({ fetchClient, retries: 3 })

    await expect(client.get('spaces/me', {}, { signal: controller.signal })).rejects.toThrow(
      'left the page'
    )
    expect(fetchClient).toHaveBeenCalledTimes(1)
  })

  it('waits for Retry-After and does not retry invalid JSON', async () => {
    vi.useFakeTimers()
    try {
      const fetchClient = vi
        .fn<FetchClient>()
        .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'retry-after': '2' } }))
        .mockResolvedValueOnce(new Response('<html>', { status: 200 }))
      const client = makeClient({ fetchClient, retries: 3 })

      const result = client.get('spaces/me').catch((e) => e)
      await vi.advanceTimersByTimeAsync(1999)
      expect(fetchClient).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(1)

      const error = await result
      expect(error).toBeInstanceOf(ApiError)
      expect(error.message).toBe('Response from "spaces/me" is not valid JSON')
      expect(fetchClient).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('turns errors thrown by Nuxt $fetch into ApiError without the request URL', async () => {
    const fetchError = Object.assign(
      new Error('[GET] "https://api.example.com/v1/contents/x?token=test-token": 404 Not Found'),
      { status: 404, data: { message: 'Not found' } }
    )
    const client = makeClient({
      fetchClient: async () => {
        throw fetchError
      },
      retries: 2,
    })

    const error = await client.get('contents/x').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, body: { message: 'Not found' } })
    expect(error.message).not.toContain('test-token')
  })

  it('cancels the remaining pages when one page fails', async () => {
    const loading: AbortSignal[] = []
    const fetchClient = vi.fn(async (input: URL | string | RequestInfo, init?: RequestInit) => {
      const page = Number(new URL(String(input)).searchParams.get('page'))
      if (page === 1) return json({ data: [1], meta: { last_page: 10 } })
      if (page === 2) return new Response('gone', { status: 410 })
      if (init?.signal) loading.push(init.signal)
      return new Promise<never>(() => {})
    })
    const client = makeClient({ fetchClient, maxConcurrency: 2 })

    await expect(client.getAll('contents')).rejects.toMatchObject({ status: 410 })
    // Pages 2 and 3 ran side by side; page 3 was cancelled and nothing started after.
    expect(fetchClient).toHaveBeenCalledTimes(3)
    expect(loading.map((signal) => signal.aborted)).toEqual([true])
  })
})
