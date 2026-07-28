import type { PaginationParams } from '@b10cks/mgmt-client'
import chalk from 'chalk'
import type { Command } from 'commander'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class TokensCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('tokens').description('manage space access tokens')

    ns.command('list')
      .description('list access tokens for a space')
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
          const res = await this.client.tokens.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No tokens found')
          console.log(`\n${chalk.bold('Tokens:')}`)
          res.data.forEach((t) => {
            console.log(`  ${chalk.yellow(t.id)}  ${chalk.bold(t.name)}`)
          })
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('create')
      .description('create a space access token')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'token name')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          let name = options.name
          if (options.interactive || !name) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'name',
                message: 'Token name:',
                default: name,
                validate: (v) => (v ? true : 'Required'),
              },
            ])
            name = answers.name
          }
          if (!name) throw new Error('--name is required')
          const token = await this.client.tokens.create(spaceId, { name })
          if (options.json) return this.outputJson(token)
          console.log(`\n${chalk.green('✓')} Token created`)
          console.log(`  ${chalk.bold('ID:')}    ${chalk.yellow(token.id)}`)
          console.log(`  ${chalk.bold('Name:')}  ${token.name}`)
          if (token.token) {
            console.log(`\n  ${chalk.bold('Token:')} ${chalk.cyan(token.token)}`)
            console.log(`  ${chalk.yellow('Copy this token — it will not be shown again.')}`)
          }
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('delete')
      .description('delete a space access token')
      .argument('<spaceId>', 'space ID')
      .argument('<tokenId>', 'token ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, tokenId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete token ${chalk.yellow(tokenId)}?`,
              default: false,
            },
          ])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.tokens.delete(spaceId, tokenId)
          this.displaySuccess(`Token ${chalk.yellow(tokenId)} deleted`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }
}
