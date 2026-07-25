import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'
import type { PaginationParams } from '@b10cks/mgmt-client'

export class AutomationsCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('automations').description('manage automations')

    this.registerList(ns)
    this.registerGet(ns)
    this.registerDelete(ns)
    this.registerTrigger(ns)
    this.registerActionsGroup(ns)
    this.registerExecutionsGroup(ns)
  }

  private registerList(ns: Command): void {
    ns.command('list')
      .description('list automations in a space')
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
          const res = await this.client.automations.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No automations found')
          console.log(`\n${chalk.bold('Automations:')}`)
          res.data.forEach((a) => {
            const enabled = a.is_active ? chalk.green(' [on]') : chalk.dim(' [off]')
            console.log(`  ${chalk.yellow(a.id)}  ${chalk.bold(a.name)}${enabled}`)
          })
        } catch (e) { this.handleError(e) }
      })
  }

  private registerGet(ns: Command): void {
    ns.command('get')
      .description('get an automation')
      .argument('<spaceId>', 'space ID')
      .argument('<automationId>', 'automation ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, automationId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.automations.get(spaceId, automationId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })
  }

  private registerDelete(ns: Command): void {
    ns.command('delete')
      .description('delete an automation')
      .argument('<spaceId>', 'space ID')
      .argument('<automationId>', 'automation ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, automationId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete automation ${chalk.yellow(automationId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.automations.delete(spaceId, automationId)
          this.displaySuccess(`Automation ${chalk.yellow(automationId)} deleted`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerTrigger(ns: Command): void {
    ns.command('trigger')
      .description('manually trigger an automation')
      .argument('<spaceId>', 'space ID')
      .argument('<automationId>', 'automation ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, automationId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.automations.trigger(spaceId, automationId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Automation ${chalk.yellow(automationId)} triggered`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerActionsGroup(ns: Command): void {
    const actions = ns.command('actions').description('manage automation actions')

    actions.command('list')
      .description('list automation actions')
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
          const res = await this.client.automations.listActions(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No automation actions found')
          console.log(`\n${chalk.bold('Automation Actions:')}`)
          res.data.forEach((a) => console.log(`  ${chalk.yellow(a.id)}  ${a.name}`))
        } catch (e) { this.handleError(e) }
      })

    actions.command('get')
      .description('get an automation action')
      .argument('<spaceId>', 'space ID')
      .argument('<actionId>', 'action ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, actionId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.automations.getAction(spaceId, actionId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })

    actions.command('delete')
      .description('delete an automation action')
      .argument('<spaceId>', 'space ID')
      .argument('<actionId>', 'action ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, actionId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete action ${chalk.yellow(actionId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.automations.deleteAction(spaceId, actionId)
          this.displaySuccess(`Action ${chalk.yellow(actionId)} deleted`)
        } catch (e) { this.handleError(e) }
      })
  }

  private registerExecutionsGroup(ns: Command): void {
    const exec = ns.command('executions').description('view automation executions')

    exec.command('list')
      .description('list automation executions')
      .argument('<spaceId>', 'space ID')
      .option('--automation-id <id>', 'filter by automation ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.automationId) params.automation_id = options.automationId
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.automations.listExecutions(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No executions found')
          console.log(`\n${chalk.bold('Executions:')}`)
          res.data.forEach((e) => {
            const status = e.status ?? ''
            const statusColor = status === 'success' ? chalk.green(status) : status === 'failed' ? chalk.red(status) : chalk.dim(status)
            console.log(`  ${chalk.yellow(e.id)}  ${statusColor}  ${chalk.dim(e.created_at ?? '')}`)
          })
        } catch (e) { this.handleError(e) }
      })

    exec.command('replay')
      .description('replay an execution')
      .argument('<spaceId>', 'space ID')
      .argument('<executionId>', 'execution ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, executionId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.automations.replayExecution(spaceId, executionId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Execution ${chalk.yellow(executionId)} replayed`)
        } catch (e) { this.handleError(e) }
      })
  }
}
