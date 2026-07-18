import type { Block } from '@b10cks/mgmt-client'

import type { BlockDefinition } from './store.js'
import { definitionFromBlock, generateExternalId, hashDefinition } from './store.js'
import { normalizeBlockSchema } from './normalizer.js'

export type SchemaDiffStatus =
  /** local and remote content are identical */
  | 'in-sync'
  /** exists locally, unknown remotely — push creates it */
  | 'new-local'
  /** local changed since last sync, remote untouched — push updates it */
  | 'local-modified'
  /** remote changed since last sync, local untouched — pull to accept */
  | 'remote-drift'
  /** both sides changed since last sync — resolve via pull or push --force */
  | 'conflict'
  /** was synced before but the remote block is gone — push recreates it */
  | 'remote-deleted'
  /** local file was deleted after a sync — push --prune deletes it remotely */
  | 'local-deleted'
  /** exists remotely but has no local file — pull to adopt, push --prune to delete */
  | 'remote-only'

export interface SchemaDiffEntry {
  status: SchemaDiffStatus
  external_id: string
  slug: string
  local: BlockDefinition | null
  remote: BlockDefinition | null
  /** remote block id, when the entry matches a remote block */
  remoteId: string | null
  /** top-level definition fields that differ between local and remote */
  changed: string[]
}

export interface SchemaDiff {
  entries: SchemaDiffEntry[]
  counts: Record<SchemaDiffStatus, number>
  /** true when anything differs at all */
  dirty: boolean
  /** true for states plain `schema push` refuses to overwrite */
  hasConflicts: boolean
}

const changedFields = (local: BlockDefinition, remote: BlockDefinition): string[] =>
  (Object.keys(local) as Array<keyof BlockDefinition>).filter((field) => {
    if (field === 'schema') {
      return (
        JSON.stringify(normalizeBlockSchema(local.schema)) !== JSON.stringify(normalizeBlockSchema(remote.schema))
      )
    }
    return JSON.stringify(local[field]) !== JSON.stringify(remote[field])
  })

/**
 * Three-way diff between the local schema directory, the last-synced hashes
 * from the lockfile, and the space's current blocks. Matches by external_id,
 * falling back to slug so pre-sync blocks can be adopted.
 */
export const computeSchemaDiff = (
  locals: BlockDefinition[],
  blocks: Block[],
  lockHashes: Record<string, string>
): SchemaDiff => {
  const remoteByExternalId = new Map<string, Block>()
  const remoteBySlug = new Map<string, Block>()
  for (const block of blocks) {
    if (block.external_id) remoteByExternalId.set(block.external_id, block)
    remoteBySlug.set(block.slug, block)
  }

  const entries: SchemaDiffEntry[] = []
  const matchedRemoteIds = new Set<string>()
  const seenExternalIds = new Set<string>()

  for (const local of locals) {
    const remote = remoteByExternalId.get(local.external_id) ?? remoteBySlug.get(local.slug) ?? null
    const lockHash = lockHashes[local.external_id]
    seenExternalIds.add(local.external_id)

    if (!remote) {
      entries.push({
        status: lockHash ? 'remote-deleted' : 'new-local',
        external_id: local.external_id,
        slug: local.slug,
        local,
        remote: null,
        remoteId: null,
        changed: [],
      })
      continue
    }

    matchedRemoteIds.add(remote.id)
    const remoteDefinition = definitionFromBlock(remote)
    // An adopted (slug-matched) remote inherits the local external_id before
    // comparing, so adoption alone doesn't read as a content change.
    if (!remoteDefinition.external_id) remoteDefinition.external_id = local.external_id

    const localHash = hashDefinition(local)
    const remoteHash = hashDefinition(remoteDefinition)

    let status: SchemaDiffStatus
    if (localHash === remoteHash) {
      status = 'in-sync'
    } else if (lockHash === remoteHash) {
      status = 'local-modified'
    } else if (lockHash === localHash) {
      status = 'remote-drift'
    } else {
      status = 'conflict'
    }

    entries.push({
      status,
      external_id: local.external_id,
      slug: local.slug,
      local,
      remote: remoteDefinition,
      remoteId: remote.id,
      changed: status === 'in-sync' ? [] : changedFields(local, remoteDefinition),
    })
  }

  for (const externalId of Object.keys(lockHashes)) {
    if (seenExternalIds.has(externalId)) continue

    const remote = remoteByExternalId.get(externalId)
    if (!remote) continue // deleted on both sides — nothing left to reconcile

    matchedRemoteIds.add(remote.id)
    entries.push({
      status: 'local-deleted',
      external_id: externalId,
      slug: remote.slug,
      local: null,
      remote: definitionFromBlock(remote),
      remoteId: remote.id,
      changed: [],
    })
  }

  for (const block of blocks) {
    if (matchedRemoteIds.has(block.id)) continue

    const remoteDefinition = definitionFromBlock(block)
    if (!remoteDefinition.external_id) remoteDefinition.external_id = generateExternalId()

    entries.push({
      status: 'remote-only',
      external_id: remoteDefinition.external_id,
      slug: block.slug,
      local: null,
      remote: remoteDefinition,
      remoteId: block.id,
      changed: [],
    })
  }

  const counts: Record<SchemaDiffStatus, number> = {
    'in-sync': 0,
    'new-local': 0,
    'local-modified': 0,
    'remote-drift': 0,
    conflict: 0,
    'remote-deleted': 0,
    'local-deleted': 0,
    'remote-only': 0,
  }
  for (const entry of entries) counts[entry.status]++

  return {
    entries,
    counts,
    dirty: entries.some((entry) => entry.status !== 'in-sync'),
    hasConflicts: counts.conflict > 0 || counts['remote-drift'] > 0,
  }
}
