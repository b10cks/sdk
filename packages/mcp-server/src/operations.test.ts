import { describe, expect, it } from 'vitest'

import type { ManagementClient } from '@b10cks/mgmt-client'

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

  it('forwards the payload for top-level create operations', async () => {
    const payload = { name: 'Marketing' }
    const calls = await run('spaces.create', { payload })
    expect(calls).toEqual([{ path: 'spaces.create', args: [payload] }])
  })

  it('defaults payload to an empty object when omitted', async () => {
    const calls = await run('users.updateMe', {})
    expect(calls).toEqual([{ path: 'users.updateMe', args: [{}] }])
  })

  it('forwards params for list operations and leaves them undefined when omitted', async () => {
    const withParams = await run('blocks.list', { spaceId: 's1', params: { page: 2 } })
    expect(withParams).toEqual([{ path: 'blocks.list', args: ['s1', { page: 2 }] }])

    const withoutParams = await run('teams.list', {})
    expect(withoutParams).toEqual([{ path: 'teams.list', args: [undefined] }])
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
})

describe('required argument validation', () => {
  it('rejects when a required string argument is missing', async () => {
    await expect(run('spaces.get', {})).rejects.toThrow(
      'Missing required string argument: spaceId'
    )
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
