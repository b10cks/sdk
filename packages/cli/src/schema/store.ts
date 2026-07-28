import { createHash, randomBytes } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'

import type { Block, SyncBlockDefinition } from '@b10cks/mgmt-client'

import { normalizeBlockSchema } from './normalizer.js'

/**
 * On-disk representation of one block: everything that defines the block,
 * nothing that ties it to a specific space (no id, folder_id or timestamps),
 * so schema directories are portable across environments.
 */
export interface BlockDefinition {
  external_id: string
  name: string
  slug: string
  type: string
  icon: string | null
  color: string | null
  description: string | null
  preview_template: string | null
  preview_file: string | null
  schema: Record<string, unknown>
  editor: unknown[]
  tags: string[]
}

export interface SchemaLockfile {
  version: 1
  /** last-synced content hash per space, keyed by external_id */
  spaces: Record<string, Record<string, string>>
}

const BLOCK_FILE_SUFFIX = '.block.json'
const LOCK_FILE = 'schema.lock.json'

export const resolveSchemaDir = (dir: string = './b10cks/schema'): string => {
  if (path.isAbsolute(dir)) return dir

  const appDir = path.join(process.cwd(), 'app')
  return fs.existsSync(appDir) ? path.join(appDir, dir) : path.join(process.cwd(), dir)
}

// ─── Canonical hashing ───────────────────────────────────────────────────────

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, entry]) => [key, canonicalize(entry)])
    )
  }
  return value
}

/**
 * Content hash of a definition after running the schema through the CMS
 * normalization pipeline — hand-written and server-served forms of the same
 * schema hash identically. Object key order never affects the hash.
 */
export const hashDefinition = (definition: BlockDefinition): string => {
  const comparable = { ...definition, schema: normalizeBlockSchema(definition.schema) }
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(comparable)))
    .digest('hex')
}

// ─── Conversions ─────────────────────────────────────────────────────────────

export const definitionFromBlock = (block: Block): BlockDefinition => ({
  external_id: block.external_id ?? '',
  name: block.name,
  slug: block.slug,
  type: block.type,
  icon: block.icon ?? null,
  color: block.color ?? null,
  description: block.description ?? null,
  preview_template: block.preview_template ?? null,
  preview_file: block.preview_file ?? null,
  schema: block.schema ?? {},
  editor: block.editor ?? [],
  tags: block.tags ?? [],
})

export const definitionToSyncPayload = (definition: BlockDefinition): SyncBlockDefinition => ({
  ...definition,
})

/** Crockford-base32 ULID, used to mint external_ids for adopted blocks. */
export const generateExternalId = (): string => {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let time = Date.now()
  let id = ''

  for (let i = 0; i < 10; i++) {
    id = alphabet[time % 32] + id
    time = Math.floor(time / 32)
  }

  for (const byte of randomBytes(16)) {
    id += alphabet[byte % 32]
  }

  return id
}

// ─── File I/O ────────────────────────────────────────────────────────────────

export const readDefinitions = (
  dir: string,
  options: { requireExternalId?: boolean } = {}
): BlockDefinition[] => {
  const { requireExternalId = true } = options
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(BLOCK_FILE_SUFFIX))
    .sort()
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch (error) {
        throw new Error(`Invalid JSON in ${path.join(dir, file)}: ${(error as Error).message}`)
      }

      const definition = parsed as Partial<BlockDefinition>
      if (!definition.slug || !definition.name || !definition.type) {
        throw new Error(`${file} is missing one of the required fields: slug, name, type`)
      }
      if (requireExternalId && !definition.external_id) {
        throw new Error(`${file} is missing external_id — run \`b10cks schema pull\` to assign ids`)
      }

      return {
        external_id: definition.external_id ?? '',
        name: definition.name,
        slug: definition.slug,
        type: definition.type,
        icon: definition.icon ?? null,
        color: definition.color ?? null,
        description: definition.description ?? null,
        preview_template: definition.preview_template ?? null,
        preview_file: definition.preview_file ?? null,
        schema: definition.schema ?? {},
        editor: definition.editor ?? [],
        tags: definition.tags ?? [],
      }
    })
}

export const writeDefinition = (dir: string, definition: BlockDefinition): string => {
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${definition.slug}${BLOCK_FILE_SUFFIX}`)
  fs.writeFileSync(file, `${JSON.stringify(definition, null, 2)}\n`)
  return file
}

export const removeDefinition = (dir: string, slug: string): void => {
  const file = path.join(dir, `${slug}${BLOCK_FILE_SUFFIX}`)
  if (fs.existsSync(file)) fs.rmSync(file)
}

// ─── Lockfile ────────────────────────────────────────────────────────────────

const lockPath = (dir: string): string => path.join(path.dirname(dir), LOCK_FILE)

export const readLockfile = (dir: string): SchemaLockfile => {
  const file = lockPath(dir)
  if (!fs.existsSync(file)) return { version: 1, spaces: {} }

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as SchemaLockfile
    return { version: 1, spaces: parsed.spaces ?? {} }
  } catch {
    return { version: 1, spaces: {} }
  }
}

export const writeLockfile = (dir: string, lockfile: SchemaLockfile): void => {
  fs.mkdirSync(path.dirname(lockPath(dir)), { recursive: true })
  fs.writeFileSync(lockPath(dir), `${JSON.stringify(canonicalize(lockfile), null, 2)}\n`)
}
