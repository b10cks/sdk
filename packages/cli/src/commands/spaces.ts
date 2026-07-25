import type { Command } from 'commander'
import type { CreateSpaceParams, PaginationParams, Space, Team, UpdateSpaceParams } from '@b10cks/mgmt-client'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

interface SpaceCommandOptions {
  name?: string
  slug?: string
  teamId?: string
  description?: string
  icon?: string
  color?: string
}

export class SpacesCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('spaces').description('manage spaces')

    this.registerList(ns)
    this.registerCreate(ns)
    this.registerGet(ns)
    this.registerUpdate(ns)
    this.registerDelete(ns)
    this.registerArchive(ns)
    this.registerHierarchy(ns)
    this.registerMembersGroup(ns)
    this.registerInvitesGroup(ns)
    this.registerBackupsGroup(ns)
    this.registerMigrationsGroup(ns)
    this.registerSubscriptionsGroup(ns)
    this.registerAiSettingsGroup(ns)
    this.registerAuditLogs(ns)
    this.registerStats(ns)
    this.registerContentMenu(ns)
    this.registerAiUsage(ns)
    this.registerUpdateIcon(ns)
    this.registerSearchGroup(ns)
    this.registerAiConfigsGroup(ns)
  }

  private registerList(ns: Command): void {
    ns.command('list')
      .description('list all spaces')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const response = await this.client.spaces.list(params)
          if (options.json) return this.outputJson(response)
          if (!response.data?.length) return console.log('No spaces found')
          console.log(`\n${chalk.bold('Spaces:')}`)
          response.data.forEach((s) => {
            const state = s.state !== 'active' ? chalk.dim(` [${s.state}]`) : ''
            console.log(`  ${chalk.yellow(s.id)}  ${chalk.bold(s.name)}  ${chalk.dim(s.slug)}${state}`)
          })
        } catch (e) { this.handleError(e) }
      })
  }

  private registerCreate(ns: Command): void {
    ns.command('create')
      .description('create a new space')
      .option('-n, --name <name>', 'space name')
      .option('-s, --slug <slug>', 'space slug (lowercase, hyphens)')
      .option('-t, --team-id <teamId>', 'team ID to assign the space to')
      .option('-d, --description <description>', 'space description')
      .option('--icon <icon>', 'space icon')
      .option('--color <color>', 'space color (hex)')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const payload = options.interactive || !options.name || !options.slug
            ? await this.promptCreateSpace(options)
            : this.buildCreatePayload(options)
          const space = await this.client.spaces.create(payload)
          if (options.json) return this.outputJson(space)
          console.log(`\n${chalk.green('✓')} Space created`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(space.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${space.name}`)
          console.log(`  ${chalk.bold('Slug:')} ${space.slug}`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerGet(ns: Command): void {
    ns.command('get')
      .description('get a space by ID')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const space = await this.client.spaces.get(spaceId)
          if (options.json) return this.outputJson(space)
          console.log(`\n${chalk.bold('Space:')}`)
          console.log(`  ${chalk.bold('ID:')}          ${chalk.yellow(space.id)}`)
          console.log(`  ${chalk.bold('Name:')}        ${space.name}`)
          console.log(`  ${chalk.bold('Slug:')}        ${space.slug}`)
          console.log(`  ${chalk.bold('State:')}       ${space.state}`)
          if (space.team_id) console.log(`  ${chalk.bold('Team ID:')}     ${space.team_id}`)
          if (space.description) console.log(`  ${chalk.bold('Description:')} ${space.description}`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerUpdate(ns: Command): void {
    ns.command('update')
      .description('update a space')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'space name')
      .option('-s, --slug <slug>', 'space slug')
      .option('-d, --description <description>', 'space description')
      .option('--icon <icon>', 'space icon')
      .option('--color <color>', 'space color (hex)')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: UpdateSpaceParams = options.interactive
            ? await this.promptUpdateSpace(options)
            : this.buildUpdatePayload(options)
          const space = await this.client.spaces.update(spaceId, payload)
          if (options.json) return this.outputJson(space)
          console.log(`${chalk.green('✓')} Space ${chalk.yellow(space.id)} updated`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerDelete(ns: Command): void {
    ns.command('delete')
      .description('delete a space')
      .argument('<spaceId>', 'space ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete space ${chalk.yellow(spaceId)}? This cannot be undone.`,
            default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.spaces.delete(spaceId)
          this.displaySuccess(`Space ${chalk.yellow(spaceId)} deleted`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerArchive(ns: Command): void {
    ns.command('archive')
      .description('archive a space')
      .argument('<spaceId>', 'space ID')
      .action(async (spaceId) => {
        this.ensureAuthenticated()
        try {
          await this.client.spaces.archive(spaceId)
          this.displaySuccess(`Space ${chalk.yellow(spaceId)} archived`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerHierarchy(ns: Command): void {
    ns.command('hierarchy')
      .description('show spaces organized by team hierarchy')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const [teamsRes, spacesRes] = await Promise.all([
            this.client.teams.list(),
            this.client.spaces.list(),
          ])
          if (options.json) return this.outputJson({ teams: teamsRes.data, spaces: spacesRes.data })
          this.printHierarchy(teamsRes.data, spacesRes.data)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerMembersGroup(ns: Command): void {
    const members = ns.command('members').description('manage space members')
    members.command('list')
      .description('list members of a space')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.spaces.listMembers(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No members found')
          console.log(`\n${chalk.bold('Members:')}`)
          res.data.forEach((m) => {
            console.log(`  ${chalk.yellow(m.id)}  ${chalk.bold(m.name ?? '')}  ${chalk.dim(m.email ?? '')}  ${m.role ?? ''}`)
          })
        } catch (e) { this.handleError(e) }
      })

    members.command('update')
      .description('update a member role')
      .argument('<spaceId>', 'space ID')
      .argument('<userId>', 'user ID')
      .requiredOption('-r, --role <role>', 'new role')
      .option('--json', 'output as JSON')
      .action(async (spaceId, userId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.updateMember(spaceId, userId, { role: options.role })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Member ${chalk.yellow(userId)} role updated to ${options.role}`)
        } catch (e) { this.handleError(e) }
      })

    members.command('remove')
      .description('remove a member from a space')
      .argument('<spaceId>', 'space ID')
      .argument('<userId>', 'user ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, userId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Remove member ${chalk.yellow(userId)} from space ${chalk.yellow(spaceId)}?`,
            default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.spaces.removeMember(spaceId, userId)
          this.displaySuccess(`Member ${chalk.yellow(userId)} removed`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerInvitesGroup(ns: Command): void {
    const invites = ns.command('invites').description('manage space invites')
    invites.command('list')
      .description('list pending invites for a space')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.spaces.listInvites(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No pending invites')
          console.log(`\n${chalk.bold('Invites:')}`)
          res.data.forEach((inv) => {
            console.log(`  ${chalk.yellow(inv.id)}  ${inv.email ?? ''}  ${inv.role ?? ''}`)
          })
        } catch (e) { this.handleError(e) }
      })

    invites.command('create')
      .description('invite a user to a space')
      .argument('<spaceId>', 'space ID')
      .option('-e, --email <email>', 'email address')
      .option('-r, --role <role>', 'role to assign')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          let email = options.email
          let role = options.role
          if (options.interactive || !email) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'email', message: 'Email address:', default: email, validate: (v) => v ? true : 'Required' },
              { type: 'input', name: 'role', message: 'Role:', default: role || 'editor' },
            ])
            email = answers.email
            role = answers.role
          }
          const res = await this.client.spaces.createInvite(spaceId, { email, role })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Invite sent to ${email}`)
        } catch (e) { this.handleError(e) }
      })

    invites.command('delete')
      .description('delete an invite')
      .argument('<spaceId>', 'space ID')
      .argument('<inviteId>', 'invite ID')
      .action(async (spaceId, inviteId) => {
        this.ensureAuthenticated()
        try {
          await this.client.spaces.deleteInvite(spaceId, inviteId)
          this.displaySuccess(`Invite ${chalk.yellow(inviteId)} deleted`)
        } catch (e) { this.handleError(e) }
      })

    invites.command('resend')
      .description('resend an invite')
      .argument('<spaceId>', 'space ID')
      .argument('<inviteId>', 'invite ID')
      .action(async (spaceId, inviteId) => {
        this.ensureAuthenticated()
        try {
          await this.client.spaces.resendInvite(spaceId, inviteId)
          this.displaySuccess(`Invite ${chalk.yellow(inviteId)} resent`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerBackupsGroup(ns: Command): void {
    const backups = ns.command('backups').description('manage space backups')
    backups.command('list')
      .description('list backups')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.spaces.listBackups(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No backups found')
          console.log(`\n${chalk.bold('Backups:')}`)
          res.data.forEach((b) => console.log(`  ${chalk.yellow(b.id)}  ${b.name ?? ''}  ${chalk.dim(b.created_at ?? '')}`))
        } catch (e) { this.handleError(e) }
      })

    backups.command('create')
      .description('create a backup')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'backup name')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.createBackup(spaceId, { name: options.name ?? '' })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Backup ${chalk.yellow(res.data.id)} created`)
        } catch (e) { this.handleError(e) }
      })

    backups.command('get')
      .description('get a backup')
      .argument('<spaceId>', 'space ID')
      .argument('<backupId>', 'backup ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, backupId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getBackup(spaceId, backupId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })

    backups.command('delete')
      .description('delete a backup')
      .argument('<spaceId>', 'space ID')
      .argument('<backupId>', 'backup ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, backupId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete backup ${chalk.yellow(backupId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.spaces.deleteBackup(spaceId, backupId)
          this.displaySuccess(`Backup ${chalk.yellow(backupId)} deleted`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerMigrationsGroup(ns: Command): void {
    const mig = ns.command('migrations').description('manage space migrations')
    mig.command('list')
      .description('list migrations')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.spaces.listMigrations(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No migrations found')
          console.log(`\n${chalk.bold('Migrations:')}`)
          res.data.forEach((m) => console.log(`  ${chalk.yellow(m.id)}  ${chalk.dim(m.created_at ?? '')}`))
        } catch (e) { this.handleError(e) }
      })

    mig.command('get')
      .description('get a migration')
      .argument('<spaceId>', 'space ID')
      .argument('<migrationId>', 'migration ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, migrationId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getMigration(spaceId, migrationId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })

    mig.command('create')
      .description('create a migration for a space')
      .argument('<spaceId>', 'space ID')
      .requiredOption('--data <json>', 'JSON payload for migration')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          const res = await this.client.spaces.createMigration(spaceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Migration ${chalk.yellow(res.data.id)} created`)
        } catch (e) { this.handleError(e) }
      })

    mig.command('delete')
      .description('delete a migration')
      .argument('<spaceId>', 'space ID')
      .argument('<migrationId>', 'migration ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, migrationId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete migration ${chalk.yellow(migrationId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.spaces.deleteMigration(spaceId, migrationId)
          this.displaySuccess(`Migration ${chalk.yellow(migrationId)} deleted`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerSubscriptionsGroup(ns: Command): void {
    const subs = ns.command('subscriptions').description('manage space subscriptions')
    subs.command('list')
      .description('list subscriptions')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.spaces.listSubscriptions(spaceId, { query: params })
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No subscriptions found')
          console.log(`\n${chalk.bold('Subscriptions:')}`)
          res.data.forEach((s) => console.log(`  ${chalk.yellow(s.id)}  ${s.plan ?? ''}`))
        } catch (e) { this.handleError(e) }
      })

    subs.command('current')
      .description('get current subscription')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getCurrentSubscription(spaceId)
          if (options.json) return this.outputJson(res)
          if (!res.data) return console.log('No active subscription')
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })

    subs.command('cancel')
      .description('cancel current subscription')
      .argument('<spaceId>', 'space ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Cancel subscription for space ${chalk.yellow(spaceId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          const res = await this.client.spaces.cancelSubscription(spaceId)
          this.displaySuccess(res.message)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerAiSettingsGroup(ns: Command): void {
    const ai = ns.command('ai-settings').description('manage space AI settings')

    ai.command('get')
      .description('get AI settings')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getAiSettings(spaceId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })

    ai.command('update')
      .description('update AI settings')
      .argument('<spaceId>', 'space ID')
      .requiredOption('--data <json>', 'JSON payload')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          const res = await this.client.spaces.updateAiSettings(spaceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess('AI settings updated')
        } catch (e) { this.handleError(e) }
      })
  }

  private registerAuditLogs(ns: Command): void {
    ns.command('audit-logs')
      .description('list audit log entries for a space')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.spaces.getAuditLogs(spaceId, Object.keys(params).length ? params : undefined)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No audit log entries')
          console.log(`\n${chalk.bold('Audit Logs:')}`)
          res.data.forEach((entry) => {
            console.log(`  ${chalk.dim(entry.created_at ?? '')}  ${chalk.bold(entry.operation)}  ${entry.owner_name ?? entry.owner_id ?? ''}`)
          })
        } catch (e) { this.handleError(e) }
      })
  }

  private registerStats(ns: Command): void {
    ns.command('stats')
      .description('get space statistics')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getStats(spaceId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) { this.handleError(e) }
      })
  }

  private registerContentMenu(ns: Command): void {
    ns.command('content-menu')
      .description('get the content menu (site structure tree) for a space')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getContentMenu(spaceId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) { this.handleError(e) }
      })
  }

  private registerAiUsage(ns: Command): void {
    ns.command('ai-usage')
      .description('get AI usage statistics for a space')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getAiUsage(spaceId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) { this.handleError(e) }
      })
  }

  private registerUpdateIcon(ns: Command): void {
    ns.command('update-icon')
      .description('update the icon for a space')
      .argument('<spaceId>', 'space ID')
      .requiredOption('--data <json>', 'JSON payload (e.g. \'{"icon":"..."}\')')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          await this.client.spaces.updateIcon(spaceId, payload)
          if (!options.json) this.displaySuccess(`Icon updated for space ${chalk.yellow(spaceId)}`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerSearchGroup(ns: Command): void {
    const search = ns.command('search').description('manage space search configuration')

    search.command('update')
      .description('update search configuration for a space')
      .argument('<spaceId>', 'space ID')
      .requiredOption('--data <json>', 'JSON payload')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          const res = await this.client.spaces.updateSearch(spaceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess('Search configuration updated')
        } catch (e) { this.handleError(e) }
      })

    search.command('reindex')
      .description('trigger a full search reindex for a space')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.reindexSearch(spaceId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Reindex triggered for space ${chalk.yellow(spaceId)}`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerAiConfigsGroup(ns: Command): void {
    const configs = ns.command('ai-configs').description('manage space AI configurations')

    configs.command('list')
      .description('list AI configurations')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.spaces.listAiConfigs(spaceId, { query: params })
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No AI configs found')
          console.log(`\n${chalk.bold('AI Configs:')}`)
          res.data.forEach((c) => console.log(`  ${chalk.yellow(c.id)}  ${c.name ?? ''}`))
        } catch (e) { this.handleError(e) }
      })

    configs.command('get')
      .description('get an AI configuration')
      .argument('<spaceId>', 'space ID')
      .argument('<configId>', 'config ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, configId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.spaces.getAiConfig(spaceId, configId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })

    configs.command('create')
      .description('create an AI configuration')
      .argument('<spaceId>', 'space ID')
      .requiredOption('--data <json>', 'JSON payload')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          const res = await this.client.spaces.createAiConfig(spaceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`AI config ${chalk.yellow(res.data.id)} created`)
        } catch (e) { this.handleError(e) }
      })

    configs.command('update')
      .description('update an AI configuration')
      .argument('<spaceId>', 'space ID')
      .argument('<configId>', 'config ID')
      .requiredOption('--data <json>', 'JSON payload')
      .option('--json', 'output as JSON')
      .action(async (spaceId, configId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          const res = await this.client.spaces.updateAiConfig(spaceId, configId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`AI config ${chalk.yellow(configId)} updated`)
        } catch (e) { this.handleError(e) }
      })

    configs.command('delete')
      .description('delete an AI configuration')
      .argument('<spaceId>', 'space ID')
      .argument('<configId>', 'config ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, configId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete AI config ${chalk.yellow(configId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.spaces.deleteAiConfig(spaceId, configId)
          this.displaySuccess(`AI config ${chalk.yellow(configId)} deleted`)
        } catch (e) { this.handleError(e) }
      })
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async promptCreateSpace(opts: SpaceCommandOptions): Promise<CreateSpaceParams> {
    const answers = await inquirer.prompt([
      {
        type: 'input', name: 'name', message: 'Space name:', default: opts.name,
        validate: (v) => v?.length > 0 ? true : 'Required',
      },
      {
        type: 'input', name: 'slug', message: 'Slug (lowercase, hyphens):', default: opts.slug,
        validate: (v) => /^[a-z0-9-]+$/.test(v) ? true : 'Only lowercase letters, numbers, hyphens',
      },
      { type: 'input', name: 'team_id', message: 'Team ID (optional):', default: opts.teamId || '' },
      { type: 'input', name: 'description', message: 'Description (optional):', default: opts.description || '' },
    ])
    const payload: CreateSpaceParams = { name: answers.name, slug: answers.slug }
    if (answers.team_id) payload.team_id = answers.team_id
    if (answers.description) payload.description = answers.description
    return payload
  }

  private buildCreatePayload(opts: SpaceCommandOptions): CreateSpaceParams {
    if (!opts.name) throw new Error('--name is required')
    if (!opts.slug) throw new Error('--slug is required')
    const payload: CreateSpaceParams = { name: opts.name, slug: opts.slug }
    if (opts.teamId) payload.team_id = opts.teamId
    if (opts.description) payload.description = opts.description
    if (opts.icon) payload.icon = opts.icon
    if (opts.color) payload.color = opts.color
    return payload
  }

  private async promptUpdateSpace(opts: SpaceCommandOptions): Promise<UpdateSpaceParams> {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'New name (leave blank to keep):', default: opts.name || '' },
      { type: 'input', name: 'slug', message: 'New slug (leave blank to keep):', default: opts.slug || '' },
      { type: 'input', name: 'description', message: 'Description:', default: opts.description || '' },
    ])
    const payload: UpdateSpaceParams = {}
    if (answers.name) payload.name = answers.name
    if (answers.slug) payload.slug = answers.slug
    if (answers.description) payload.description = answers.description
    return payload
  }

  private buildUpdatePayload(opts: SpaceCommandOptions): UpdateSpaceParams {
    const payload: UpdateSpaceParams = {}
    if (opts.name) payload.name = opts.name
    if (opts.slug) payload.slug = opts.slug
    if (opts.description) payload.description = opts.description
    if (opts.icon) payload.icon = opts.icon
    if (opts.color) payload.color = opts.color
    return payload
  }

  private printHierarchy(teams: Team[], spaces: Space[], indent = 0): void {
    if (indent === 0) {
      console.log(`\n${chalk.bold('Hierarchy:')}`)
      const rootTeams = teams.filter((t) => !t.parent_id)
      const orphanSpaces = spaces.filter((s) => !s.team_id)
      orphanSpaces.forEach((s) => {
        console.log(`${'  '.repeat(indent + 1)}${chalk.cyan('◆')} ${chalk.bold(s.name)} ${chalk.dim(s.id)}`)
      })
      rootTeams.forEach((t) => this.printTeamNode(t, teams, spaces, indent + 1))
    }
  }

  private printTeamNode(team: Team, allTeams: Team[], allSpaces: Space[], indent: number): void {
    console.log(`${'  '.repeat(indent)}${chalk.blue('▸')} ${chalk.bold(team.name)} ${chalk.dim(team.id)}`)
    const teamSpaces = allSpaces.filter((s) => s.team_id === team.id)
    teamSpaces.forEach((s) => {
      console.log(`${'  '.repeat(indent + 1)}${chalk.cyan('◆')} ${chalk.bold(s.name)} ${chalk.dim(s.id)}`)
    })
    const children = allTeams.filter((t) => t.parent_id === team.id)
    children.forEach((child) => this.printTeamNode(child, allTeams, allSpaces, indent + 1))
  }
}
