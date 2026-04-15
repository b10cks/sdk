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
  const buildContent = (id: string, theme = id) => ({
    id,
    slug: id,
    name: id,
    content: { theme },
    type: 'page',
    parent_id: null,
    full_slug: id,
    language_iso: 'en',
    published_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  })

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

    const first = await dataApi.getRedirects({}, { allPages: true })
    const second = await dataApi.getRedirects({}, { allPages: true })
    const third = await dataApi.getRedirects({}, true)

    expect(first).toEqual({ '/old': { target: '/new', status_code: 301 } })
    expect(second).toBe(first)
    expect(third).toEqual({ '/old-2': { target: '/new-2', status_code: 302 } })
    expect(client.getAll).toHaveBeenCalledTimes(2)
  })

  it('can fetch only the first page for collection requests', async () => {
    const client: DataApiClient = {
      get: vi.fn().mockResolvedValue({
        data: [buildContent('content-1')],
        meta: { last_page: 3 },
      }),
      getAll: vi.fn(),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)
    const contents = await dataApi.getContents({ vid: 'published' }, { allPages: false })

    expect(contents).toEqual([buildContent('content-1')])
    expect(client.get).toHaveBeenCalledWith('contents', { vid: 'published' })
    expect(client.getAll).not.toHaveBeenCalled()
  })

  it('does not cache partial redirect pages as the full redirect map', async () => {
    const client: DataApiClient = {
      get: vi.fn().mockResolvedValue({
        data: [{ source: '/old', target: '/new', status_code: 301 }],
        meta: { last_page: 2 },
      }),
      getAll: vi
        .fn()
        .mockResolvedValueOnce([
          { source: '/old', target: '/new', status_code: 301 },
          { source: '/old-2', target: '/new-2', status_code: 302 },
        ]),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    const partial = await dataApi.getRedirects({}, { allPages: false })
    const full = await dataApi.getRedirects()

    expect(partial).toEqual({ '/old': { target: '/new', status_code: 301 } })
    expect(full).toEqual({
      '/old': { target: '/new', status_code: 301 },
      '/old-2': { target: '/new-2', status_code: 302 },
    })
    expect(client.get).toHaveBeenCalledWith('redirects', {})
    expect(client.getAll).toHaveBeenCalledTimes(1)
  })

  it('passes an explicitly provided vid through content requests', async () => {
    const client: DataApiClient = {
      get: vi.fn().mockResolvedValue({
        data: buildContent('content-1', 'content-1'),
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
      get: vi.fn().mockResolvedValue({ data: [] }),
      getAll: vi.fn().mockResolvedValue([]),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    await dataApi.getContents({ vid: 'published' })

    expect(client.get).toHaveBeenCalledWith('contents', { vid: 'published' })
    expect(client.getAll).not.toHaveBeenCalled()
  })

  it('fetches all pages only when explicitly requested', async () => {
    const client: DataApiClient = {
      get: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    await dataApi.getContents({ vid: 'published' }, { allPages: true })

    expect(client.getAll).toHaveBeenCalledWith('contents', { vid: 'published' })
  })

  it('passes sitemap params through sitemap requests', async () => {
    const client: DataApiClient = {
      get: vi.fn().mockResolvedValue({ data: [] }),
      getAll: vi.fn().mockResolvedValue([]),
      setRv: vi.fn(),
    }

    const dataApi = new B10cksDataApi(client)

    await dataApi.getSitemap({
      vid: 'published',
      language_iso: 'en',
      per_page: 100,
      page: 1,
    })

    expect(client.get).toHaveBeenCalledWith('sitemap', {
      vid: 'published',
      language_iso: 'en',
      per_page: 100,
      page: 1,
    })
    expect(client.getAll).not.toHaveBeenCalled()
  })

  it('includes vid in config cache keys and forwards it to config requests', async () => {
    const client: DataApiClient = {
      get: vi
        .fn()
        .mockResolvedValueOnce({
          data: buildContent('config-1', 'draft'),
        })
        .mockResolvedValueOnce({
          data: buildContent('config-2', 'published'),
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
