import type { PaginationParams } from '@b10cks/mgmt-client'
import chalk from 'chalk'
import type { Command } from 'commander'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class BlockTagsCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('block-tags').description('manage block tags')

    ns.command('list')
      .description('list block tags in a space')
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
          const res = await this.client.blockTags.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No block tags found')
          console.log(`\n${chalk.bold('Block Tags:')}`)
          res.data.forEach((t) => console.log(`  ${chalk.yellow(t.id)}  ${t.name}`))
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('create')
      .description('create a block tag')
      .argument('<spaceId>', 'space ID')
      .requiredOption('-n, --name <name>', 'tag name')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blockTags.create(spaceId, { name: options.name })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Block tag ${chalk.yellow(res.id)} created`)
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('get')
      .description('get a block tag')
      .argument('<spaceId>', 'space ID')
      .argument('<tagId>', 'tag ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, tagId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blockTags.get(spaceId, tagId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('update')
      .description('update a block tag')
      .argument('<spaceId>', 'space ID')
      .argument('<tagId>', 'tag ID')
      .requiredOption('-n, --name <name>', 'new tag name')
      .option('--json', 'output as JSON')
      .action(async (spaceId, tagId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blockTags.update(spaceId, tagId, { name: options.name })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Block tag ${chalk.yellow(res.id)} updated`)
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('delete')
      .description('delete a block tag')
      .argument('<spaceId>', 'space ID')
      .argument('<tagId>', 'tag ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, tagId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete block tag ${chalk.yellow(tagId)}?`,
              default: false,
            },
          ])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.blockTags.delete(spaceId, tagId)
          this.displaySuccess(`Block tag ${chalk.yellow(tagId)} deleted`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }
}
