import type { PaginationParams, Redirect } from '@b10cks/mgmt-client'
import chalk from 'chalk'
import type { Command } from 'commander'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class RedirectsCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('redirects').description('manage redirects')

    ns.command('list')
      .description('list redirects in a space')
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
          const res = await this.client.redirects.list(
            spaceId,
            Object.keys(params).length ? params : undefined
          )
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No redirects found')
          console.log(`\n${chalk.bold('Redirects:')}`)
          res.data.forEach((r) => {
            console.log(`  ${chalk.yellow(r.id)}  ${chalk.dim(r.source)}  →  ${r.destination}`)
          })
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('create')
      .description('create a redirect')
      .argument('<spaceId>', 'space ID')
      .option('--from <from>', 'source path')
      .option('--to <to>', 'target URL')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          let from = options.from
          let to = options.to
          if (options.interactive || !from || !to) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'from',
                message: 'Source path:',
                default: from,
                validate: (v) => (v ? true : 'Required'),
              },
              {
                type: 'input',
                name: 'to',
                message: 'Target URL:',
                default: to,
                validate: (v) => (v ? true : 'Required'),
              },
            ])
            from = answers.from
            to = answers.to
          }
          if (!from) throw new Error('--from is required')
          if (!to) throw new Error('--to is required')
          const res = await this.client.redirects.create(spaceId, { source: from, destination: to })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Redirect ${chalk.yellow(res.id)} created`)
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('get')
      .description('get a redirect')
      .argument('<spaceId>', 'space ID')
      .argument('<redirectId>', 'redirect ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, redirectId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.redirects.get(spaceId, redirectId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('update')
      .description('update a redirect')
      .argument('<spaceId>', 'space ID')
      .argument('<redirectId>', 'redirect ID')
      .option('--from <from>', 'source path')
      .option('--to <to>', 'target URL')
      .option('--json', 'output as JSON')
      .action(async (spaceId, redirectId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: Partial<Redirect> = {}
          if (options.from) payload.source = options.from
          if (options.to) payload.destination = options.to
          const res = await this.client.redirects.update(spaceId, redirectId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Redirect ${chalk.yellow(res.id)} updated`)
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('delete')
      .description('delete a redirect')
      .argument('<spaceId>', 'space ID')
      .argument('<redirectId>', 'redirect ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, redirectId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete redirect ${chalk.yellow(redirectId)}?`,
              default: false,
            },
          ])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.redirects.delete(spaceId, redirectId)
          this.displaySuccess(`Redirect ${chalk.yellow(redirectId)} deleted`)
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('reset')
      .description('reset a redirect hit counter')
      .argument('<spaceId>', 'space ID')
      .argument('<redirectId>', 'redirect ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, redirectId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.redirects.reset(spaceId, redirectId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Redirect ${chalk.yellow(redirectId)} reset`)
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('export')
      .description('export redirects as JSON')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.redirects.exportData(spaceId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('import')
      .description('import redirects from JSON (pass payload via --data)')
      .argument('<spaceId>', 'space ID')
      .requiredOption('--data <json>', 'JSON payload (e.g. \'{"redirects":[...]}\')')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          const res = await this.client.redirects.importData(spaceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess('Redirects imported')
          if (res) console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })
  }
}
