import type { ManagementClient } from '@b10cks/mgmt-client'
import { describe, expect, it } from 'vitest'

import { operationMap, operations, type MgmtToolArguments } from './operations'

interface RecordedCall {
  path: string
  args: unknown[]
}

/**
 * A recording stand-in for the ManagementClient. Every `client.<resource>.<method>(...)`
 * access is intercepted so tests can assert an operation dispatched to the right
 * method with the right positional arguments, without touching the network.
 */
function createMockClient() {
  const calls: RecordedCall[] = []

  const makeResource = (resource: string) =>
    new Proxy(
      {},
      {
        get:
          (_target, method: string) =>
          (...args: unknown[]) => {
            calls.push({ path: `${resource}.${method}`, args })
            return Promise.resolve({ resource, method, args })
          },
      }
    )

  const client = new Proxy(
    {},
    {
      get: (_target, resource: string) => makeResource(resource),
    }
  ) as unknown as ManagementClient

  return { client, calls }
}

const run = async (name: string, args: Omit<MgmtToolArguments, 'operation'>) => {
  const operation = operationMap.get(name)
  if (!operation) throw new Error(`unknown operation ${name}`)
  const { client, calls } = createMockClient()
  await operation.handler(client, { operation: name, ...args })
  return calls
}

describe('operations registry', () => {
  it('exposes a non-empty, self-consistent operation map', () => {
    expect(operations.length).toBeGreaterThan(0)
    expect(operationMap.size).toBe(operations.length)
  })

  it('every operation has a name, description and handler', () => {
    for (const op of operations) {
      expect(op.name, `name for ${op.name}`).toBeTruthy()
      expect(op.description, `description for ${op.name}`).toBeTruthy()
      expect(typeof op.handler, `handler for ${op.name}`).toBe('function')
    }
  })

  it('has no duplicate operation names', () => {
    const names = operations.map((op) => op.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('operation dispatch', () => {
  it('passes spaceId through to the client method', async () => {
    const calls = await run('spaces.get', { spaceId: 's1' })
    expect(calls).toEqual([{ path: 'spaces.get', args: ['s1'] }])
  })

  it('forwards spaceId and payload for space-scoped create operations', async () => {
    const payload = { name: 'Hero' }
    const calls = await run('blocks.create', { spaceId: 's1', payload })
    expect(calls).toEqual([{ path: 'blocks.create', args: ['s1', payload] }])
  })

  it('forwards spaceId and payload for blocks.sync', async () => {
    const payload = {
      blocks: [{ external_id: 'ext-1', name: 'Hero', slug: 'hero', type: 'nestable' }],
      dry_run: true,
    }
    const calls = await run('blocks.sync', { spaceId: 's1', payload })
    expect(calls).toEqual([{ path: 'blocks.sync', args: ['s1', payload] }])
  })

  it('forwards the payload for top-level create operations', async () => {
    const payload = { name: 'Marketing' }
    const calls = await run('spaces.create', { payload })
    expect(calls).toEqual([{ path: 'spaces.create', args: [payload] }])
  })

  it('defaults payload to an empty object when omitted', async () => {
    const calls = await run('users.updateMe', {})
    expect(calls).toEqual([{ path: 'users.updateMe', args: [{}] }])
  })

  it('forwards params to the dedicated params argument for list operations that accept one', async () => {
    const withParams = await run('blocks.list', { spaceId: 's1', params: { page: 2 } })
    expect(withParams).toEqual([{ path: 'blocks.list', args: ['s1', { page: 2 }] }])
  })

  it('passes params in the dedicated params slot of list operations', async () => {
    const withParams = await run('teams.list', { params: { page: 2 } })
    expect(withParams).toEqual([{ path: 'teams.list', args: [{ page: 2 }] }])

    const withoutParams = await run('teams.list', {})
    expect(withoutParams).toEqual([{ path: 'teams.list', args: [undefined] }])
  })

  it('never lets a params.headers key reach the request options', async () => {
    const calls = await run('teams.list', {
      params: { headers: { Authorization: 'Bearer attacker' }, page: 1 } as never,
    })
    // headers lands in the params slot, which the client serialises into the
    // query string — never into the options object that supplies real headers.
    expect(calls).toEqual([
      { path: 'teams.list', args: [{ headers: { Authorization: 'Bearer attacker' }, page: 1 }] },
    ])
  })

  it('strips prototype-polluting keys from params', async () => {
    // JSON.parse produces an *own* __proto__ property, exactly as an untrusted
    // MCP payload would arrive over the wire.
    const params = JSON.parse('{"__proto__":{"polluted":true},"page":1}')
    const calls = await run('teams.list', { params })
    expect(calls).toEqual([{ path: 'teams.list', args: [{ page: 1 }] }])
  })

  it('resolves the id via the generic `id` argument', async () => {
    const calls = await run('blocks.get', { spaceId: 's1', id: 'b1' })
    expect(calls).toEqual([{ path: 'blocks.get', args: ['s1', 'b1'] }])
  })

  it('prefers a resource-specific id over the generic id', async () => {
    const calls = await run('blocks.get', { spaceId: 's1', id: 'generic', blockId: 'specific' })
    expect(calls).toEqual([{ path: 'blocks.get', args: ['s1', 'specific'] }])
  })

  it('dispatches loop-generated CRUD resources', async () => {
    const list = await run('assets.list', { spaceId: 's1' })
    expect(list).toEqual([{ path: 'assets.list', args: ['s1', undefined] }])

    const get = await run('assetFolders.get', { spaceId: 's1', id: 'f1' })
    expect(get).toEqual([{ path: 'assetFolders.get', args: ['s1', 'f1'] }])
  })

  it('extracts nested payload fields for assetTags.assign', async () => {
    const calls = await run('assetTags.assign', {
      spaceId: 's1',
      id: 't1',
      payload: { asset_ids: ['a1', 'a2'] },
    })
    expect(calls).toEqual([{ path: 'assetTags.assign', args: ['s1', 't1', ['a1', 'a2']] }])
  })

  it('defaults asset_ids to an empty array when missing', async () => {
    const calls = await run('assetTags.assign', { spaceId: 's1', id: 't1', payload: {} })
    expect(calls).toEqual([{ path: 'assetTags.assign', args: ['s1', 't1', []] }])
  })

  it('unwraps asset_ids for the collection membership operations', async () => {
    const calls = await run('assetCollections.addAssets', {
      spaceId: 's1',
      collectionId: 'c1',
      payload: { asset_ids: ['a1', 'a2'] },
    })
    expect(calls).toEqual([
      { path: 'assetCollections.addAssets', args: ['s1', 'c1', ['a1', 'a2']] },
    ])
  })

  it('passes the share token and access token positionally', async () => {
    const calls = await run('shares.listAssets', {
      spaceId: 's1',
      token: 'tok',
      accessToken: 'acc',
      params: { per_page: 10 },
    })
    expect(calls).toEqual([
      { path: 'shares.listAssets', args: ['s1', 'tok', { per_page: 10 }, 'acc'] },
    ])
  })

  it('leaves the access token undefined for a share with no password', async () => {
    const calls = await run('shares.get', { spaceId: 's1', token: 'tok' })
    expect(calls).toEqual([{ path: 'shares.get', args: ['s1', 'tok', undefined] }])
  })

  it('extracts the password for shares.unlock', async () => {
    const calls = await run('shares.unlock', {
      spaceId: 's1',
      token: 'tok',
      payload: { password: 'hunter2' },
    })
    expect(calls).toEqual([{ path: 'shares.unlock', args: ['s1', 'tok', 'hunter2'] }])
  })

  it('dispatches notification operations that take no arguments', async () => {
    expect(await run('notifications.unreadCount', {})).toEqual([
      { path: 'users.getUnreadNotificationCount', args: [] },
    ])
  })

  it('resolves a notification id from the generic id argument', async () => {
    const calls = await run('notifications.markRead', { id: 'n1' })
    expect(calls).toEqual([{ path: 'users.markNotificationAsRead', args: ['n1'] }])
  })

  it('requires a teamId for team-scoped operations', async () => {
    await expect(run('teams.listBlueprints', {})).rejects.toThrow(
      'Missing required string argument: teamId'
    )
  })
})

describe('required argument validation', () => {
  it('rejects when a required string argument is missing', async () => {
    await expect(run('spaces.get', {})).rejects.toThrow('Missing required string argument: spaceId')
  })

  it('rejects when a required argument is an empty string', async () => {
    await expect(run('spaces.get', { spaceId: '' })).rejects.toThrow(
      'Missing required string argument: spaceId'
    )
  })

  it('rejects when neither the resource id nor the generic id is provided', async () => {
    await expect(run('blocks.get', { spaceId: 's1' })).rejects.toThrow(
      'Missing required string argument: id'
    )
  })
})
