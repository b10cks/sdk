import type { Command } from 'commander'
import type { CreateTeamParams, UpdateTeamParams } from '@b10cks/mgmt-client'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class TeamsCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('teams').description('manage teams')

    this.registerList(ns)
    this.registerCreate(ns)
    this.registerGet(ns)
    this.registerUpdate(ns)
    this.registerDelete(ns)
    this.registerHierarchy(ns)
    this.registerMembersGroup(ns)
    this.registerInvitesGroup(ns)
    this.registerBlueprintsGroup(ns)
    this.registerRolesGroup(ns)
    this.registerSamlGroup(ns)
  }

  private registerList(ns: Command): void {
    ns.command('list')
      .description('list all teams')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.teams.list(params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No teams found')
          console.log(`\n${chalk.bold('Teams:')}`)
          res.data.forEach((t) => {
            const parent = t.parent_id ? chalk.dim(` (parent: ${t.parent_id})`) : ''
            console.log(`  ${chalk.yellow(t.id)}  ${chalk.bold(t.name)}${parent}`)
          })
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerCreate(ns: Command): void {
    ns.command('create')
      .description('create a new team')
      .option('-n, --name <name>', 'team name')
      .option('-p, --parent-id <parentId>', 'parent team ID')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const payload = options.interactive || !options.name
            ? await this.promptCreateTeam(options)
            : this.buildCreatePayload(options)
          const team = await this.client.teams.create(payload)
          if (options.json) return this.outputJson(team)
          console.log(`\n${chalk.green('✓')} Team created`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(team.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${team.name}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerGet(ns: Command): void {
    ns.command('get')
      .description('get a team by ID')
      .argument('<teamId>', 'team ID')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          const team = await this.client.teams.get(teamId)
          if (options.json) return this.outputJson(team)
          console.log(`\n${chalk.bold('Team:')}`)
          console.log(`  ${chalk.bold('ID:')}        ${chalk.yellow(team.id)}`)
          console.log(`  ${chalk.bold('Name:')}      ${team.name}`)
          if (team.parent_id) console.log(`  ${chalk.bold('Parent ID:')} ${team.parent_id}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerUpdate(ns: Command): void {
    ns.command('update')
      .description('update a team')
      .argument('<teamId>', 'team ID')
      .option('-n, --name <name>', 'team name')
      .option('-p, --parent-id <parentId>', 'parent team ID')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: UpdateTeamParams = options.interactive
            ? await this.promptUpdateTeam(options)
            : this.buildUpdatePayload(options)
          const team = await this.client.teams.update(teamId, payload)
          if (options.json) return this.outputJson(team)
          this.displaySuccess(`Team ${chalk.yellow(team.id)} updated`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerDelete(ns: Command): void {
    ns.command('delete')
      .description('delete a team')
      .argument('<teamId>', 'team ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete team ${chalk.yellow(teamId)}? This cannot be undone.`,
            default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.teams.delete(teamId)
          this.displaySuccess(`Team ${chalk.yellow(teamId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerHierarchy(ns: Command): void {
    ns.command('hierarchy')
      .description('show team hierarchy')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.teams.getHierarchy()
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerMembersGroup(ns: Command): void {
    const members = ns.command('members').description('manage team members')
    members.command('list')
      .description('list members of a team')
      .argument('<teamId>', 'team ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.teams.listMembers(teamId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No members found')
          console.log(`\n${chalk.bold('Members:')}`)
          res.data.forEach((m) => {
            console.log(`  ${chalk.yellow(m.id)}  ${(m as any).name ?? ''}  ${(m as any).role ?? ''}`)
          })
        } catch (e: any) { this.handleError(e) }
      })

    members.command('update')
      .description('update a member role')
      .argument('<teamId>', 'team ID')
      .argument('<userId>', 'user ID')
      .requiredOption('-r, --role <role>', 'new role')
      .action(async (teamId, userId, options) => {
        this.ensureAuthenticated()
        try {
          await this.client.teams.updateMember(teamId, userId, { role: options.role })
          this.displaySuccess(`Member ${chalk.yellow(userId)} role updated to ${options.role}`)
        } catch (e: any) { this.handleError(e) }
      })

    members.command('remove')
      .description('remove a member from a team')
      .argument('<teamId>', 'team ID')
      .argument('<userId>', 'user ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (teamId, userId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Remove member ${chalk.yellow(userId)} from team ${chalk.yellow(teamId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.teams.removeMember(teamId, userId)
          this.displaySuccess(`Member ${chalk.yellow(userId)} removed`)
        } catch (e: any) { this.handleError(e) }
      })

    members.command('add')
      .description('add a user to a team')
      .argument('<teamId>', 'team ID')
      .requiredOption('-u, --user-id <userId>', 'user ID')
      .option('-r, --role <role>', 'role to assign')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          await this.client.teams.addUser(teamId, { user_id: options.userId, role: options.role })
          this.displaySuccess(`User ${chalk.yellow(options.userId)} added to team`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerInvitesGroup(ns: Command): void {
    const invites = ns.command('invites').description('manage team invites')
    invites.command('list')
      .description('list pending invites')
      .argument('<teamId>', 'team ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.teams.listInvites(teamId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No pending invites')
          console.log(`\n${chalk.bold('Invites:')}`)
          res.data.forEach((inv) => console.log(`  ${chalk.yellow(inv.id)}  ${(inv as any).email ?? ''}  ${(inv as any).role ?? ''}`))
        } catch (e: any) { this.handleError(e) }
      })

    invites.command('create')
      .description('invite a user to a team')
      .argument('<teamId>', 'team ID')
      .option('-e, --email <email>', 'email address')
      .option('-r, --role <role>', 'role to assign')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          let email = options.email
          let role = options.role
          if (options.interactive || !email) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'email', message: 'Email:', default: email, validate: (v) => v ? true : 'Required' },
              { type: 'input', name: 'role', message: 'Role:', default: role || 'member' },
            ])
            email = answers.email
            role = answers.role
          }
          const res = await this.client.teams.createInvite(teamId, { email, role })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Invite sent to ${email}`)
        } catch (e: any) { this.handleError(e) }
      })

    invites.command('delete')
      .description('delete an invite')
      .argument('<teamId>', 'team ID')
      .argument('<inviteId>', 'invite ID')
      .action(async (teamId, inviteId) => {
        this.ensureAuthenticated()
        try {
          await this.client.teams.deleteInvite(teamId, inviteId)
          this.displaySuccess(`Invite ${chalk.yellow(inviteId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })

    invites.command('resend')
      .description('resend an invite')
      .argument('<teamId>', 'team ID')
      .argument('<inviteId>', 'invite ID')
      .action(async (teamId, inviteId) => {
        this.ensureAuthenticated()
        try {
          await this.client.teams.resendInvite(teamId, inviteId)
          this.displaySuccess(`Invite ${chalk.yellow(inviteId)} resent`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerBlueprintsGroup(ns: Command): void {
    const bp = ns.command('blueprints').description('manage team space blueprints')
    bp.command('list')
      .description('list blueprints')
      .argument('<teamId>', 'team ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.teams.listBlueprints(teamId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No blueprints found')
          console.log(`\n${chalk.bold('Blueprints:')}`)
          res.data.forEach((b) => console.log(`  ${chalk.yellow(b.id)}  ${b.name}`))
        } catch (e: any) { this.handleError(e) }
      })

    bp.command('get')
      .description('get a blueprint')
      .argument('<teamId>', 'team ID')
      .argument('<blueprintId>', 'blueprint ID')
      .option('--json', 'output as JSON')
      .action(async (teamId, blueprintId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.teams.getBlueprint(teamId, blueprintId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    bp.command('delete')
      .description('delete a blueprint')
      .argument('<teamId>', 'team ID')
      .argument('<blueprintId>', 'blueprint ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (teamId, blueprintId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete blueprint ${chalk.yellow(blueprintId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.teams.deleteBlueprint(teamId, blueprintId)
          this.displaySuccess(`Blueprint ${chalk.yellow(blueprintId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerRolesGroup(ns: Command): void {
    const roles = ns.command('roles').description('manage team space roles')
    roles.command('list')
      .description('list space roles for a team')
      .argument('<teamId>', 'team ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.teams.listSpaceRoles(teamId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No roles found')
          console.log(`\n${chalk.bold('Space Roles:')}`)
          res.data.forEach((r) => console.log(`  ${chalk.yellow(r.id)}  ${r.name}`))
        } catch (e: any) { this.handleError(e) }
      })

    roles.command('delete')
      .description('delete a space role')
      .argument('<teamId>', 'team ID')
      .argument('<roleId>', 'role ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (teamId, roleId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete role ${chalk.yellow(roleId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.teams.deleteSpaceRole(teamId, roleId)
          this.displaySuccess(`Role ${chalk.yellow(roleId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerSamlGroup(ns: Command): void {
    const saml = ns.command('saml').description('manage team SAML provider')
    saml.command('get')
      .description('get SAML provider config')
      .argument('<teamId>', 'team ID')
      .option('--json', 'output as JSON')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.teams.getSamlProvider(teamId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    saml.command('delete')
      .description('delete SAML provider config')
      .argument('<teamId>', 'team ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (teamId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete SAML provider for team ${chalk.yellow(teamId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.teams.deleteSamlProvider(teamId)
          this.displaySuccess('SAML provider deleted')
        } catch (e: any) { this.handleError(e) }
      })
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async promptCreateTeam(opts: any): Promise<CreateTeamParams> {
    const answers = await inquirer.prompt([
      {
        type: 'input', name: 'name', message: 'Team name:', default: opts.name,
        validate: (v) => v?.length > 0 ? true : 'Required',
      },
      { type: 'input', name: 'parent_id', message: 'Parent team ID (optional):', default: opts.parentId || '' },
    ])
    const payload: CreateTeamParams = { name: answers.name }
    if (answers.parent_id) payload.parent_id = answers.parent_id
    return payload
  }

  private buildCreatePayload(opts: any): CreateTeamParams {
    if (!opts.name) throw new Error('--name is required')
    const payload: CreateTeamParams = { name: opts.name }
    if (opts.parentId) payload.parent_id = opts.parentId
    return payload
  }

  private async promptUpdateTeam(opts: any): Promise<UpdateTeamParams> {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'New name:', default: opts.name || '' },
    ])
    const payload: UpdateTeamParams = {}
    if (answers.name) payload.name = answers.name
    return payload
  }

  private buildUpdatePayload(opts: any): UpdateTeamParams {
    const payload: UpdateTeamParams = {}
    if (opts.name) payload.name = opts.name
    return payload
  }
}
