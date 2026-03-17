import { describe, expect, it, vi } from 'vitest'

import type { DataApiClient, GetConfigOptions } from './data-api'

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

  it('passes an explicitly provided vid through content requests', async () => {
    const client: DataApiClient = {
      get: vi.fn().mockResolvedValue({
        data: {
          id: 'content-1',
          slug: 'home',
          name: 'Home',
          content: {},
          type: 'page',
          parent_id: null,
          full_slug: 'home',
          language_iso: 'en',
          published_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      }),
      getAll: vi.fn(),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    await dataApi.getContent('home', { vid: 'draft' })

    expect(client.get).toHaveBeenCalledWith('contents/home', { vid: 'draft' })
  })

  it('passes an explicitly provided vid through collection requests', async () => {
    const client: DataApiClient = {
      get: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    await dataApi.getContents({ vid: 'published' })

    expect(client.getAll).toHaveBeenCalledWith('contents', { vid: 'published' })
  })

  it('includes vid in config cache keys and forwards it to config requests', async () => {
    const client: DataApiClient = {
      get: vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            id: 'config-1',
            slug: '_config',
            name: 'Config',
            content: { theme: 'draft' },
            type: 'config',
            parent_id: null,
            full_slug: '_config',
            language_iso: 'en',
            published_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        })
        .mockResolvedValueOnce({
          data: {
            id: 'config-2',
            slug: '_config',
            name: 'Config',
            content: { theme: 'published' },
            type: 'config',
            parent_id: null,
            full_slug: '_config',
            language_iso: 'en',
            published_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        }),
      getAll: vi.fn(),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    const draftOptions: GetConfigOptions = { vid: 'draft' }
    const publishedOptions: GetConfigOptions = { vid: 'published' }

    const draftConfig = await dataApi.getConfig<{ theme: string }>(draftOptions)
    const publishedConfig = await dataApi.getConfig<{ theme: string }>(publishedOptions)

    expect(draftConfig).toEqual({ theme: 'draft' })
    expect(publishedConfig).toEqual({ theme: 'published' })
    expect(client.get).toHaveBeenNthCalledWith(1, 'contents/_config', {
      vid: 'draft',
      language_iso: undefined,
    })
    expect(client.get).toHaveBeenNthCalledWith(2, 'contents/_config', {
      vid: 'published',
      language_iso: undefined,
    })
  })
})
