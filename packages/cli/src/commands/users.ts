import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class UsersCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('users').description('manage user account')

    this.registerMe(ns)
    this.registerTokensGroup(ns)
    this.registerInvitesGroup(ns)
  }

  private registerMe(ns: Command): void {
    const me = ns.command('me').description('manage your account')

    me.command('get')
      .description('get your profile')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.users.getMe()
          if (options.json) return this.outputJson(res)
          const u = res.data
          console.log(`\n${chalk.bold('Profile:')}`)
          console.log(`  ${chalk.bold('ID:')}    ${chalk.yellow(u.id)}`)
          console.log(`  ${chalk.bold('Name:')}  ${(u as any).name ?? ''}`)
          console.log(`  ${chalk.bold('Email:')} ${(u as any).email ?? ''}`)
        } catch (e: any) { this.handleError(e) }
      })

    me.command('update')
      .description('update your profile')
      .option('--name <name>', 'display name')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          let payload: any = {}
          if (options.interactive) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'name', message: 'Display name:', default: options.name },
            ])
            if (answers.name) payload.name = answers.name
          } else {
            if (options.name) payload.name = options.name
          }
          const res = await this.client.users.updateMe(payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess('Profile updated')
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerTokensGroup(ns: Command): void {
    const tokens = ns.command('tokens').description('manage personal access tokens')

    tokens.command('list')
      .description('list your personal access tokens')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.users.listTokens()
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No personal access tokens found')
          console.log(`\n${chalk.bold('Personal Access Tokens:')}`)
          res.data.forEach((t) => {
            const lastUsed = (t as any).last_used_at ? chalk.dim(` (last used: ${(t as any).last_used_at})`) : ''
            console.log(`  ${chalk.yellow(t.id)}  ${chalk.bold(t.name)}${lastUsed}`)
          })
        } catch (e: any) { this.handleError(e) }
      })

    tokens.command('create')
      .description('create a personal access token')
      .option('-n, --name <name>', 'token name')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          let name = options.name
          if (options.interactive || !name) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'name', message: 'Token name:', default: name, validate: (v) => v ? true : 'Required' },
            ])
            name = answers.name
          }
          if (!name) throw new Error('--name is required')
          const res = await this.client.users.createToken({ name })
          if (options.json) return this.outputJson(res)
          const t = res.data
          console.log(`\n${chalk.green('✓')} Personal access token created`)
          console.log(`  ${chalk.bold('ID:')}    ${chalk.yellow(t.id)}`)
          console.log(`  ${chalk.bold('Name:')}  ${t.name}`)
          if (t.token) {
            console.log(`\n  ${chalk.bold('Token:')} ${chalk.cyan(t.token)}`)
            console.log(`  ${chalk.yellow('Copy this token — it will not be shown again.')}`)
          }
        } catch (e: any) { this.handleError(e) }
      })

    tokens.command('delete')
      .description('delete a personal access token')
      .argument('<tokenId>', 'token ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (tokenId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete token ${chalk.yellow(tokenId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.users.deleteToken(tokenId)
          this.displaySuccess(`Token ${chalk.yellow(tokenId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerInvitesGroup(ns: Command): void {
    const invites = ns.command('invites').description('manage invites')

    invites.command('list')
      .description('list your pending invites')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.users.listInvites()
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No pending invites')
          console.log(`\n${chalk.bold('Invites:')}`)
          res.data.forEach((inv) => {
            console.log(`  ${chalk.yellow(inv.id)}  ${(inv as any).space_name ?? (inv as any).team_name ?? ''}`)
          })
        } catch (e: any) { this.handleError(e) }
      })

    invites.command('get')
      .description('get an invite')
      .argument('<inviteId>', 'invite ID')
      .option('--json', 'output as JSON')
      .action(async (inviteId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.users.getInvite(inviteId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    invites.command('accept')
      .description('accept an invite')
      .argument('<inviteId>', 'invite ID')
      .option('--json', 'output as JSON')
      .action(async (inviteId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.users.acceptInvite(inviteId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Invite ${chalk.yellow(inviteId)} accepted`)
        } catch (e: any) { this.handleError(e) }
      })
  }
}
