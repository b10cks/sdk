import chalk from 'chalk'
import type { Command } from 'commander'

import type { SchemaDiff, SchemaDiffEntry } from '../schema/diff.js'
import { computeSchemaDiff } from '../schema/diff.js'
import {
  definitionFromBlock,
  definitionToSyncPayload,
  generateExternalId,
  hashDefinition,
  readDefinitions,
  readLockfile,
  resolveSchemaDir,
  writeDefinition,
  writeLockfile,
} from '../schema/store.js'
import { BaseCommand } from './BaseCommand.js'

const STATUS_LABELS: Record<
  SchemaDiffEntry['status'],
  { label: string; color: (s: string) => string }
> = {
  'in-sync': { label: 'in sync', color: chalk.green },
  'new-local': { label: 'new (push creates)', color: chalk.cyan },
  'local-modified': { label: 'modified (push updates)', color: chalk.yellow },
  'remote-drift': { label: 'remote drift (pull to accept)', color: chalk.magenta },
  conflict: { label: 'conflict (pull or push --force)', color: chalk.red },
  'remote-deleted': { label: 'deleted remotely (push recreates)', color: chalk.red },
  'local-deleted': { label: 'deleted locally (push --prune removes)', color: chalk.yellow },
  'remote-only': { label: 'remote only (pull to adopt)', color: chalk.blue },
}

export class SchemaCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program
      .command('schema')
      .description(
        'sync block schemas between local files and a space (local files are the source of truth)'
      )

    this.registerPull(ns)
    this.registerDiff(ns)
    this.registerPush(ns)
  }

  private registerPull(ns: Command): void {
    ns.command('pull')
      .description("write the space's block schemas to local files and record the sync state")
      .argument('<spaceId>', 'space ID')
      .option('--dir <path>', 'schema directory', './b10cks/schema')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const dir = resolveSchemaDir(options.dir)
          const { data: blocks } = await this.client.blocks.list(spaceId, { per_page: 9999 })

          const lockfile = readLockfile(dir)
          const hashes: Record<string, string> = {}
          const adopted: string[] = []
          const files: string[] = []

          for (const block of blocks) {
            const definition = definitionFromBlock(block)
            if (!definition.external_id) {
              definition.external_id = generateExternalId()
              adopted.push(definition.slug)
            }
            files.push(writeDefinition(dir, definition))
            hashes[definition.external_id] = hashDefinition(definition)
          }

          lockfile.spaces[spaceId] = hashes
          writeLockfile(dir, lockfile)

          if (options.json) return this.outputJson({ dir, blocks: blocks.length, adopted, files })

          this.displaySuccess(`Pulled ${blocks.length} block schema(s) into ${dir}`)
          if (adopted.length > 0) {
            console.log(
              `${chalk.yellow('!')} Assigned new external_ids to: ${adopted.join(', ')} — run ${chalk.bold('b10cks schema push')} to persist them`
            )
          }
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerDiff(ns: Command): void {
    ns.command('diff')
      .description(
        'compare local schema files against the space (three-way, using the lockfile as base)'
      )
      .argument('<spaceId>', 'space ID')
      .option('--dir <path>', 'schema directory', './b10cks/schema')
      .option('--ci', 'exit with code 1 when anything is out of sync')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const diff = await this.loadDiff(spaceId, options.dir)

          if (options.json) {
            this.outputJson({
              dirty: diff.dirty,
              counts: diff.counts,
              entries: diff.entries.map(({ status, external_id, slug, changed }) => ({
                status,
                external_id,
                slug,
                changed,
              })),
            })
          } else {
            this.printDiff(diff)
          }

          if (options.ci && diff.dirty) process.exit(1)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerPush(ns: Command): void {
    ns.command('push')
      .description('apply local schema files to the space (upsert by external_id)')
      .argument('<spaceId>', 'space ID')
      .option('--dir <path>', 'schema directory', './b10cks/schema')
      .option('--prune', 'delete remote blocks that have no local schema file')
      .option('--dry-run', 'show the server-computed plan without applying it')
      .option('--force', 'overwrite blocks that changed remotely since the last sync')
      .option('-m, --message <message>', 'commit message recorded on updated block versions')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const dir = resolveSchemaDir(options.dir)
          const locals = readDefinitions(dir)

          if (locals.length === 0) {
            return this.handleError(
              new Error(
                `No *.block.json files in ${dir} — run \`b10cks schema pull ${spaceId}\` first`
              )
            )
          }

          const diff = await this.loadDiff(spaceId, options.dir)

          if (diff.hasConflicts && !options.force && !options.dryRun) {
            const blocked = diff.entries.filter(
              (entry) => entry.status === 'conflict' || entry.status === 'remote-drift'
            )
            console.error(`${chalk.red('✖')} The space changed since the last sync:`)
            for (const entry of blocked) {
              const { label, color } = STATUS_LABELS[entry.status]
              console.error(`  ${color('•')} ${chalk.bold(entry.slug)} — ${label}`)
            }
            console.error(
              `\nRun ${chalk.bold('b10cks schema pull')} to accept the remote state or ${chalk.bold('b10cks schema push --force')} to overwrite it.`
            )
            process.exit(1)
          }

          const { data: result } = await this.client.blocks.sync(spaceId, {
            blocks: locals.map(definitionToSyncPayload),
            prune: Boolean(options.prune),
            dry_run: Boolean(options.dryRun),
            commit_message: options.message ?? 'b10cks schema push',
          })

          if (!options.dryRun) {
            const lockfile = readLockfile(dir)
            lockfile.spaces[spaceId] = Object.fromEntries(
              locals.map((definition) => [definition.external_id, hashDefinition(definition)])
            )
            writeLockfile(dir, lockfile)
          }

          if (options.json) return this.outputJson(result)

          const { summary } = result
          const prefix = result.dry_run
            ? `${chalk.blue('▸')} Plan (dry run)`
            : `${chalk.green('✓')} Synced`
          console.log(
            `${prefix}: ${summary.created} created, ${summary.updated} updated, ${summary.unchanged} unchanged, ${summary.deleted} deleted`
          )
          for (const entry of result.results) {
            if (entry.action === 'unchanged') continue
            const changed =
              entry.changed.length > 0 ? chalk.dim(` (${entry.changed.join(', ')})`) : ''
            console.log(
              `  ${chalk.cyan(entry.action.padEnd(9))} ${chalk.bold(entry.slug)}${changed}`
            )
          }
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private async loadDiff(spaceId: string, dirOption: string): Promise<SchemaDiff> {
    const dir = resolveSchemaDir(dirOption)
    const locals = readDefinitions(dir)
    const { data: blocks } = await this.client.blocks.list(spaceId, { per_page: 9999 })
    const lockfile = readLockfile(dir)

    return computeSchemaDiff(locals, blocks, lockfile.spaces[spaceId] ?? {})
  }

  private printDiff(diff: SchemaDiff): void {
    if (diff.entries.length === 0) {
      console.log('No local schema files and no remote blocks — nothing to compare')
      return
    }

    console.log(`\n${chalk.bold('Schema status:')}`)
    for (const entry of diff.entries) {
      const { label, color } = STATUS_LABELS[entry.status]
      const changed = entry.changed.length > 0 ? chalk.dim(` (${entry.changed.join(', ')})`) : ''
      console.log(`  ${color('●')} ${chalk.bold(entry.slug.padEnd(24))} ${color(label)}${changed}`)
    }

    const dirtyCount = diff.entries.length - diff.counts['in-sync']
    console.log(
      diff.dirty
        ? `\n${chalk.yellow(`${dirtyCount} block(s) out of sync`)}`
        : `\n${chalk.green('Everything in sync')}`
    )
  }
}
