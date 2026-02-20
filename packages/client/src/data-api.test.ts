import { describe, expect, it, vi } from 'vitest'

import type { DataApiClient } from './data-api'

import { B10cksDataApi } from './data-api'
import { ApiClient } from './index'

describe('ApiClient', () => {
  it('paginates without duplicating the first page', async () => {
    const fetchClient = vi.fn(async (input: URL | string | RequestInfo) => {
      const requestUrl = new URL(String(input))
      const page = Number(requestUrl.searchParams.get('page') || '1')

      return {
        data: [{ page }],
        meta: { last_page: 3 },
        rv: page,
      }
    })

    const client = new ApiClient(
      {
        baseUrl: 'https://api.example.com',
        token: 'test-token',
        fetchClient,
      },
      'https://app.example.com'
    )

    const items = await client.getAll<{ page: number }>('contents')

    expect(items).toEqual([{ page: 1 }, { page: 2 }, { page: 3 }])
    expect(fetchClient).toHaveBeenCalledTimes(3)
  })

  it('parses native fetch responses', async () => {
    const fetchClient = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: { id: 'space-1' }, rv: 42 }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        })
    )

    const client = new ApiClient(
      {
        baseUrl: 'https://api.example.com',
        token: 'test-token',
        fetchClient,
      },
      'https://app.example.com'
    )

    const response = await client.get<{ id: string }>('spaces/me')

    expect(response).toEqual({ data: { id: 'space-1' }, rv: 42 })
    expect(client.getRv()).toBe(42)
  })
})

describe('B10cksDataApi', () => {
  it('caches redirects until force refresh is requested', async () => {
    const client: DataApiClient = {
      get: vi.fn(),
      getAll: vi
        .fn()
        .mockResolvedValueOnce([{ source: '/old', target: '/new', status_code: 301 }])
        .mockResolvedValueOnce([{ source: '/old-2', target: '/new-2', status_code: 302 }]),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    const first = await dataApi.getRedirects()
    const second = await dataApi.getRedirects()
    const third = await dataApi.getRedirects({}, true)

    expect(first).toEqual({ '/old': { target: '/new', status_code: 301 } })
    expect(second).toBe(first)
    expect(third).toEqual({ '/old-2': { target: '/new-2', status_code: 302 } })
    expect(client.getAll).toHaveBeenCalledTimes(2)
  })
})
