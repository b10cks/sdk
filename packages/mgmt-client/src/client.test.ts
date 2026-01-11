import { describe, expect, it, vi } from 'vitest'
import { ManagementClient } from './client'
import { ManagementApiError } from './http-client'

global.fetch = vi.fn()

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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUser,
      })

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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...updateParams, id: '1' }),
      })

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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', ...createParams }),
      })

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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: '1', ...createParams }),
      })

      const client = new ManagementClient(mockConfig)
      const space = await client.spaces.create(createParams)

      expect(space.name).toBe(createParams.name)
      expect(space.slug).toBe(createParams.slug)
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

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

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
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], meta: {}, links: {} }),
      })

      const client = new ManagementClient(mockConfig)
      await client.blocks.list('space-1', {
        search: 'test search',
        type: 'article',
        sort: '-created_at',
      })

      const callUrl = (global.fetch as any).mock.calls[0][0]
      expect(callUrl).toContain('search=test+search')
      expect(callUrl).toContain('type=article')
      expect(callUrl).toContain('sort=-created_at')
    })

    it('should handle array query parameters', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], meta: {}, links: {} }),
      })

      const client = new ManagementClient(mockConfig)
      await client.blocks.list('space-1', {
        type: ['article', 'page'],
      })

      const callUrl = (global.fetch as any).mock.calls[0][0]
      expect(callUrl).toContain('type')
    })
  })
})
