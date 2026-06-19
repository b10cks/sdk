import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class BlockFoldersCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('block-folders').description('manage block folders')

    ns.command('list')
      .description('list block folders in a space')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blockFolders.list(spaceId)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No block folders found')
          console.log(`\n${chalk.bold('Block Folders:')}`)
          res.data.forEach((f) => console.log(`  ${chalk.yellow(f.id)}  ${f.name}`))
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('create')
      .description('create a block folder')
      .argument('<spaceId>', 'space ID')
      .requiredOption('-n, --name <name>', 'folder name')
      .option('--parent-id <parentId>', 'parent folder ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: any = { name: options.name }
          if (options.parentId) payload.parent_id = options.parentId
          const res = await this.client.blockFolders.create(spaceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Block folder ${chalk.yellow(res.id)} created`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('get')
      .description('get a block folder')
      .argument('<spaceId>', 'space ID')
      .argument('<folderId>', 'folder ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, folderId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blockFolders.get(spaceId, folderId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('update')
      .description('update a block folder')
      .argument('<spaceId>', 'space ID')
      .argument('<folderId>', 'folder ID')
      .requiredOption('-n, --name <name>', 'new folder name')
      .option('--json', 'output as JSON')
      .action(async (spaceId, folderId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blockFolders.update(spaceId, folderId, { name: options.name })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Block folder ${chalk.yellow(res.id)} updated`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('delete')
      .description('delete a block folder')
      .argument('<spaceId>', 'space ID')
      .argument('<folderId>', 'folder ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, folderId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete block folder ${chalk.yellow(folderId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.blockFolders.delete(spaceId, folderId)
          this.displaySuccess(`Block folder ${chalk.yellow(folderId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }
}
