import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { Block } from '@b10cks/mgmt-client'
import { afterEach, describe, expect, it } from 'vitest'

import { computeSchemaDiff } from './diff'
import type { BlockDefinition } from './store'
import {
  definitionFromBlock,
  generateExternalId,
  hashDefinition,
  readDefinitions,
  readLockfile,
  writeDefinition,
  writeLockfile,
} from './store'

const definition = (overrides: Partial<BlockDefinition> = {}): BlockDefinition => ({
  external_id: 'ext-hero',
  name: 'Hero',
  slug: 'hero',
  type: 'nestable',
  icon: null,
  color: null,
  description: null,
  preview_template: null,
  preview_file: null,
  schema: { title: { type: 'text', required: true } },
  editor: [],
  tags: [],
  ...overrides,
})

const block = (overrides: Partial<Block> = {}): Block =>
  ({
    id: 'blk-1',
    external_id: 'ext-hero',
    name: 'Hero',
    slug: 'hero',
    type: 'nestable',
    description: null,
    icon: null,
    color: null,
    schema: { title: { type: 'text', required: true } },
    editor: [],
    tags: [],
    settings: null,
    folder_id: null,
    space_id: 'space-1',
    created_at: '',
    updated_at: '',
    ...overrides,
  }) as Block

describe('hashDefinition', () => {
  it('hashes a hand-written schema and its server-normalized form identically', () => {
    const local = definition()
    const served = definition({
      schema: {
        title: {
          key: 'title',
          type: 'text',
          name: 'title',
          description: null,
          required: true,
          translatable: false,
          indexable: true,
          default: null,
          conditions: null,
          validation: [],
        },
      },
    })

    expect(hashDefinition(local)).toBe(hashDefinition(served))
  })

  it('is insensitive to object key order', () => {
    const a = definition({ schema: { title: { type: 'text', required: true } } })
    const b = definition({ schema: { title: { required: true, type: 'text' } } })

    expect(hashDefinition(a)).toBe(hashDefinition(b))
  })
})

describe('computeSchemaDiff', () => {
  it('reports in-sync when local matches remote', () => {
    const local = definition()
    const diff = computeSchemaDiff([local], [block()], { 'ext-hero': hashDefinition(local) })

    expect(diff.entries[0].status).toBe('in-sync')
    expect(diff.dirty).toBe(false)
    expect(diff.hasConflicts).toBe(false)
  })

  it('classifies the four modification states via the lockfile base', () => {
    const base = definition()
    const baseHash = hashDefinition(base)
    const localEdit = definition({ name: 'Hero Section' })
    const remoteEdit = block({ name: 'Hero Banner' })

    expect(
      computeSchemaDiff([localEdit], [block()], { 'ext-hero': baseHash }).entries[0].status
    ).toBe('local-modified')
    expect(
      computeSchemaDiff([base], [remoteEdit], { 'ext-hero': baseHash }).entries[0].status
    ).toBe('remote-drift')
    expect(
      computeSchemaDiff([localEdit], [remoteEdit], { 'ext-hero': baseHash }).entries[0].status
    ).toBe('conflict')
    expect(computeSchemaDiff([localEdit], [remoteEdit], {}).entries[0].status).toBe('conflict')
  })

  it('reports changed top-level fields', () => {
    const diff = computeSchemaDiff(
      [definition({ name: 'Hero Section', tags: ['layout'] })],
      [block()],
      {}
    )

    expect(diff.entries[0].changed).toEqual(['name', 'tags'])
  })

  it('matches remote blocks without external_id by slug (adoption)', () => {
    const local = definition()
    const diff = computeSchemaDiff([local], [block({ external_id: null })], {})

    expect(diff.entries[0].status).toBe('in-sync')
    expect(diff.entries[0].remoteId).toBe('blk-1')
  })

  it('classifies additions and deletions on both sides', () => {
    const local = definition()
    const localHash = hashDefinition(local)

    expect(computeSchemaDiff([local], [], {}).entries[0].status).toBe('new-local')
    expect(computeSchemaDiff([local], [], { 'ext-hero': localHash }).entries[0].status).toBe(
      'remote-deleted'
    )
    expect(computeSchemaDiff([], [block()], { 'ext-hero': localHash }).entries[0].status).toBe(
      'local-deleted'
    )
    expect(computeSchemaDiff([], [block()], {}).entries[0].status).toBe('remote-only')
  })
})

describe('store file round-trip', () => {
  let dir: string

  afterEach(() => rmSync(join(dir, '..'), { recursive: true, force: true }))

  it('writes, reads and locks definitions', () => {
    dir = join(mkdtempSync(join(tmpdir(), 'b10cks-schema-')), 'schema')

    const local = definition()
    writeDefinition(dir, local)

    expect(readDefinitions(dir)).toEqual([local])

    writeLockfile(dir, { version: 1, spaces: { 'space-1': { 'ext-hero': hashDefinition(local) } } })
    expect(readLockfile(dir).spaces['space-1']['ext-hero']).toBe(hashDefinition(local))
  })

  it('rejects files without external_id unless told otherwise', () => {
    dir = join(mkdtempSync(join(tmpdir(), 'b10cks-schema-')), 'schema')

    writeDefinition(dir, definition({ external_id: '' }))

    expect(() => readDefinitions(dir)).toThrow(/external_id/)
    expect(readDefinitions(dir, { requireExternalId: false })).toHaveLength(1)
  })
})

describe('generateExternalId', () => {
  it('mints 26-char ULIDs', () => {
    const id = generateExternalId()
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
    expect(generateExternalId()).not.toBe(id)
  })
})

describe('definitionFromBlock', () => {
  it('strips space-specific fields', () => {
    const def = definitionFromBlock(block({ folder_id: 'fld-1', templates_count: 3 }))

    expect(def).not.toHaveProperty('id')
    expect(def).not.toHaveProperty('folder_id')
    expect(def).not.toHaveProperty('templates_count')
    expect(def.slug).toBe('hero')
  })
})
