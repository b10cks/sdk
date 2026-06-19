import type { Command } from 'commander'

import chalk from 'chalk'

import { BaseCommand } from './BaseCommand.js'

export class SystemCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('system').description('system information and configuration')

    ns.command('health')
      .description('check API health')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        try {
          const res = await this.client.system.health()
          if (options.json) return this.outputJson(res)
          console.log(`${chalk.green('✓')} API is healthy`)
          if (res && typeof res === 'object') {
            console.log(JSON.stringify(res, null, 2))
          }
        } catch (e: any) {
          console.error(`${chalk.red('✖')} API health check failed: ${e.message}`)
          process.exit(1)
        }
      })

    ns.command('config')
      .description('get system configuration')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.system.getConfig()
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('plans')
      .description('list available subscription plans')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        try {
          const res = await this.client.system.getPlans()
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No plans found')
          console.log(`\n${chalk.bold('Plans:')}`)
          res.data.forEach((p) => {
            console.log(`  ${chalk.yellow(p.id)}  ${chalk.bold(p.name ?? '')}`)
          })
        } catch (e: any) { this.handleError(e) }
      })
  }
}
