import { describe, expect, it, vi } from 'vitest'

import { ManagementClient } from './client'
import { ManagementApiError } from './http-client'

global.fetch = vi.fn()

const mockJsonResponse = (body: unknown, status = 200) => ({
  ok: true,
  status,
  headers: { get: (_: string) => 'application/json' },
  json: async () => body,
})

describe('ManagementClient', () => {
  const mockConfig = {
    baseUrl: 'https://api.test.com',
    token: 'test-token',
  }

  describe('initialization', () => {
    it('should create client with config', () => {
      const client = new ManagementClient(mockConfig)
      expect(client).toBeDefined()
      expect(client.users).toBeDefined()
      expect(client.teams).toBeDefined()
      expect(client.spaces).toBeDefined()
    })

    it('should initialize all resource managers', () => {
      const client = new ManagementClient(mockConfig)
      expect(client.blocks).toBeDefined()
      expect(client.blockTags).toBeDefined()
      expect(client.blockFolders).toBeDefined()
      expect(client.contents).toBeDefined()
      expect(client.assets).toBeDefined()
      expect(client.assetFolders).toBeDefined()
      expect(client.assetTags).toBeDefined()
      expect(client.redirects).toBeDefined()
      expect(client.tokens).toBeDefined()
      expect(client.dataSources).toBeDefined()
      expect(client.ai).toBeDefined()
      expect(client.system).toBeDefined()
    })
  })

  describe('Users resource', () => {
    it('should get current user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstname: 'John',
        lastname: 'Doe',
        avatar: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse(mockUser))

      const client = new ManagementClient(mockConfig)
      const user = await client.users.getMe()

      expect(user).toEqual(mockUser)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mgmt/v1/users/me'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('should update current user', async () => {
      const updateParams = {
        firstname: 'Jane',
        lastname: 'Smith',
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ ...updateParams, id: '1' }))

      const client = new ManagementClient(mockConfig)
      await client.users.updateMe(updateParams)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mgmt/v1/users/me'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateParams),
        })
      )
    })
  })

  describe('Teams resource', () => {
    it('should list teams', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Team 1' },
          { id: '2', name: 'Team 2' },
        ],
        links: {
          first: 'http://api.test.com',
          last: 'http://api.test.com',
          prev: null,
          next: null,
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 10,
          to: 2,
          total: 2,
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse(mockResponse))

      const client = new ManagementClient(mockConfig)
      const teams = await client.teams.list()

      expect(teams.data).toHaveLength(2)
      expect(teams.meta.total).toBe(2)
    })

    it('should create team', async () => {
      const createParams = {
        name: 'New Team',
        icon: '🚀',
        color: '#FF5733',
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ id: '1', ...createParams }))

      const client = new ManagementClient(mockConfig)
      const team = await client.teams.create(createParams)

      expect(team.name).toBe(createParams.name)
    })
  })

  describe('Spaces resource', () => {
    it('should create space', async () => {
      const createParams = {
        name: 'Test Space',
        slug: 'test-space',
        icon: '📦',
        color: '#4A90E2',
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ id: '1', ...createParams }))

      const client = new ManagementClient(mockConfig)
      const space = await client.spaces.create(createParams)

      expect(space.name).toBe(createParams.name)
      expect(space.slug).toBe(createParams.slug)
    })

    it('should create content with translations payload', async () => {
      const createParams = {
        name: 'Home',
        slug: 'home',
        block_id: 'page-block',
        language_iso: 'en',
        content: {
          title: 'Home',
        },
        translations: [
          {
            name: 'Startseite',
            slug: 'startseite',
            language_iso: 'de',
            content: {
              title: 'Startseite',
            },
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ id: 'content-1', ...createParams }, 201))

      const client = new ManagementClient(mockConfig)
      await client.contents.create('space-1', createParams)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mgmt/v1/spaces/space-1/contents'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(createParams),
        })
      )
    })

    it('should publish content with payload', async () => {
      const publishParams = {
        published_at: '2024-05-01T12:30:00Z',
        translations: [
          {
            id: 'translation-1',
            content: {
              title: 'Startseite',
            },
            published_at: '2024-05-01T12:30:00Z',
          },
        ],
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ id: 'content-1', published_at: publishParams.published_at }))

      const client = new ManagementClient(mockConfig)
      await client.contents.publish('space-1', 'content-1', publishParams)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mgmt/v1/spaces/space-1/contents/content-1/publish'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(publishParams),
        })
      )
    })

    it('should delete space', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const client = new ManagementClient(mockConfig)
      await client.spaces.delete('space-1')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mgmt/v1/spaces/space-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Path parameter encoding', () => {
    it('URL-encodes path traversal attempts in resource ids', async () => {
      const client = new ManagementClient(mockConfig)
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ data: {} }) as never)

      await client.contents.get('space-1', '../../users/me/tokens')

      const url = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string
      expect(url).toBe(
        'https://api.test.com/mgmt/v1/spaces/space-1/contents/..%2F..%2Fusers%2Fme%2Ftokens'
      )
    })

    it('URL-encodes query and fragment characters in resource ids', async () => {
      const client = new ManagementClient(mockConfig)
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ data: {} }) as never)

      await client.contents.get('space?force=1', 'id#frag')

      const url = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string
      expect(url).toContain('/mgmt/v1/spaces/space%3Fforce%3D1/contents/id%23frag')
    })
  })

  describe('Releases resource', () => {
    it('sends the payload when removing a release version (DELETE with body)', async () => {
      const client = new ManagementClient(mockConfig)
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse({ data: {} }) as never)

      await client.releases.removeVersion('space-1', 'rel-1', { content_id: 'c-1' } as never)

      const [url, init] = vi.mocked(fetch).mock.calls.at(-1) as [string, RequestInit]
      expect(url).toContain('/mgmt/v1/spaces/space-1/releases/rel-1/versions/remove')
      expect(init.method).toBe('DELETE')
      expect(init.body).toBe(JSON.stringify({ content_id: 'c-1' }))
    })
  })

  describe('Error handling', () => {
    it('should throw ManagementApiError on API error', async () => {
      const errorResponse = {
        message: 'Not found',
        error: 'resource_not_found',
        code: 404,
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: (_: string) => 'application/json' },
        json: async () => errorResponse,
      })

      const client = new ManagementClient(mockConfig)

      await expect(client.users.getMe()).rejects.toThrow(ManagementApiError)
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const client = new ManagementClient(mockConfig)

      await expect(client.users.getMe()).rejects.toThrow()
    })
  })

  describe('Pagination', () => {
    it('should handle paginated responses', async () => {
      const mockResponse = {
        data: Array.from({ length: 10 }, (_, i) => ({ id: `${i + 1}` })),
        links: {
          first: 'http://api.test.com?page=1',
          last: 'http://api.test.com?page=5',
          prev: null,
          next: 'http://api.test.com?page=2',
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 5,
          per_page: 10,
          to: 10,
          total: 50,
        },
      }

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse(mockResponse))

      const client = new ManagementClient(mockConfig)
      const result = await client.blocks.list('space-1', {
        page: 1,
        per_page: 10,
      })

      expect(result.data).toHaveLength(10)
      expect(result.meta.total).toBe(50)
      expect(result.links.next).toBeDefined()
    })
  })

  describe('Query parameters', () => {
    it('should properly encode query parameters', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ data: [], meta: {}, links: {} }))

      const client = new ManagementClient(mockConfig)
      await client.blocks.list('space-1', {
        search: 'test search',
        type: 'article',
        sort: '-created_at',
      })

      const callUrl = (global.fetch as any).mock.lastCall[0]
      expect(callUrl).toContain('search=test+search')
      expect(callUrl).toContain('type=article')
      expect(callUrl).toContain('sort=-created_at')
    })

    it('should handle array query parameters', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ data: [], meta: {}, links: {} }))

      const client = new ManagementClient(mockConfig)
      await client.blocks.list('space-1', {
        type: ['article', 'page'],
      })

      const callUrl = (global.fetch as any).mock.lastCall[0]
      expect(callUrl).toContain('type')
    })
  })

  describe('Blocks resource', () => {
    it('syncs block definitions via PUT blocks/sync', async () => {
      const mockResult = {
        data: {
          dry_run: false,
          results: [{ action: 'created', id: 'blk-1', external_id: 'ext-1', slug: 'hero', changed: [] }],
          summary: { created: 1, updated: 0, unchanged: 0, deleted: 0 },
        },
      }
      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse(mockResult))

      const client = new ManagementClient(mockConfig)
      const result = await client.blocks.sync('space-1', {
        blocks: [{ external_id: 'ext-1', name: 'Hero', slug: 'hero', type: 'nestable' }],
        dry_run: false,
        commit_message: 'initial sync',
      })

      const [url, init] = (global.fetch as any).mock.lastCall
      expect(url).toContain('/mgmt/v1/spaces/space-1/blocks/sync')
      expect(init.method).toBe('PUT')
      expect(JSON.parse(init.body).blocks).toHaveLength(1)
      expect(result.data.summary.created).toBe(1)
      expect(result.data.results[0].action).toBe('created')
    })
  })

  describe('Asset collections resource', () => {
    it('removes assets via a DELETE that carries the ids in the body', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse(undefined, 204))

      const client = new ManagementClient(mockConfig)
      await client.assetCollections.removeAssets('space-1', 'col-1', ['a1', 'a2'])

      const [url, init] = (global.fetch as any).mock.lastCall
      expect(url).toContain('/mgmt/v1/spaces/space-1/asset-collections/col-1/assets')
      expect(init.method).toBe('DELETE')
      expect(JSON.parse(init.body)).toEqual({ asset_ids: ['a1', 'a2'] })
    })

    it('sends the full ordered list when reordering', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse(undefined, 204))

      const client = new ManagementClient(mockConfig)
      await client.assetCollections.reorderAssets('space-1', 'col-1', ['a2', 'a1'])

      const [url, init] = (global.fetch as any).mock.lastCall
      expect(url).toContain('/asset-collections/col-1/assets/order')
      expect(init.method).toBe('PATCH')
      expect(JSON.parse(init.body)).toEqual({ asset_ids: ['a2', 'a1'] })
    })
  })

  describe('Public shares resource', () => {
    it('sends the management token when no share access token is given', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ data: { name: 'Deck' } }))

      const client = new ManagementClient(mockConfig)
      await client.shares.get('space-1', 'tok-1')

      const [, init] = (global.fetch as any).mock.lastCall
      expect(init.headers.Authorization).toBe('Bearer test-token')
    })

    it('replaces the management token with the share access token', async () => {
      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({ data: [], meta: {} }))

      const client = new ManagementClient(mockConfig)
      await client.shares.listAssets('space-1', 'tok-1', { per_page: 10 }, 'share-access-token')

      const [url, init] = (global.fetch as any).mock.lastCall
      expect(url).toContain('/mgmt/v1/shares/space-1/tok-1/assets')
      expect(url).toContain('per_page=10')
      // The share access token is the credential these routes verify — the
      // management token must not shadow it.
      expect(init.headers.Authorization).toBe('Bearer share-access-token')
    })

    it('reads an asset preview as binary rather than text', async () => {
      const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' })
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: (_: string) => 'image/png' },
        blob: async () => blob,
        text: async () => {
          throw new Error('binary responses must not be read as text')
        },
      })

      const client = new ManagementClient(mockConfig)
      const result = await client.shares.previewAsset('space-1', 'tok-1', 'asset-1', 'acc')

      expect(result).toBe(blob)
      const [, init] = (global.fetch as any).mock.lastCall
      expect(init.headers.accept).toBe('*/*')
      expect(init.headers.Authorization).toBe('Bearer acc')
    })
  })

  describe('AI resource', () => {
    it('targets the streaming routes, the only ones the API exposes', async () => {
      const client = new ManagementClient(mockConfig)

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({}))
      await client.ai.translate({ text: 'hi' })
      expect((global.fetch as any).mock.lastCall[0]).toContain('/mgmt/v1/ai/translate/stream')

      ;(global.fetch as any).mockResolvedValueOnce(mockJsonResponse({}))
      await client.ai.generateMetaTags({ text: 'hi' })
      expect((global.fetch as any).mock.lastCall[0]).toContain('/mgmt/v1/ai/meta-tags/stream')
    })
  })
})
