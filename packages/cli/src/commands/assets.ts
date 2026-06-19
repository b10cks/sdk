import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class AssetsCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('assets').description('manage assets')

    this.registerList(ns)
    this.registerGet(ns)
    this.registerUpdate(ns)
    this.registerDelete(ns)
    this.registerLinkedContents(ns)
    this.registerFoldersGroup(ns)
    this.registerTagsGroup(ns)
  }

  private registerList(ns: Command): void {
    ns.command('list')
      .description('list assets in a space')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.assets.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No assets found')
          console.log(`\n${chalk.bold('Assets:')}`)
          res.data.forEach((a) => {
            console.log(`  ${chalk.yellow(a.id)}  ${chalk.bold(a.filename ?? '')}  ${chalk.dim(a.mime_type ?? '')}`)
          })
          console.log(`\n${chalk.dim(`Total: ${res.data.length}`)}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerGet(ns: Command): void {
    ns.command('get')
      .description('get an asset by ID')
      .argument('<spaceId>', 'space ID')
      .argument('<assetId>', 'asset ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, assetId, options) => {
        this.ensureAuthenticated()
        try {
          const asset = await this.client.assets.get(spaceId, assetId)
          if (options.json) return this.outputJson(asset)
          console.log(`\n${chalk.bold('Asset:')}`)
          console.log(`  ${chalk.bold('ID:')}        ${chalk.yellow(asset.id)}`)
          console.log(`  ${chalk.bold('Filename:')}  ${asset.filename ?? ''}`)
          console.log(`  ${chalk.bold('MIME type:')} ${asset.mime_type ?? ''}`)
          console.log(`  ${chalk.bold('URL:')}        ${(asset as any).url ?? ''}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerUpdate(ns: Command): void {
    ns.command('update')
      .description('update asset metadata')
      .argument('<spaceId>', 'space ID')
      .argument('<assetId>', 'asset ID')
      .option('--alt <alt>', 'alt text')
      .option('--title <title>', 'title')
      .option('--json', 'output as JSON')
      .action(async (spaceId, assetId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: any = {}
          if (options.alt !== undefined) payload.alt = options.alt
          if (options.title !== undefined) payload.title = options.title
          const asset = await this.client.assets.update(spaceId, assetId, payload)
          if (options.json) return this.outputJson(asset)
          this.displaySuccess(`Asset ${chalk.yellow(asset.id)} updated`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerDelete(ns: Command): void {
    ns.command('delete')
      .description('delete an asset')
      .argument('<spaceId>', 'space ID')
      .argument('<assetId>', 'asset ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, assetId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete asset ${chalk.yellow(assetId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.assets.delete(spaceId, assetId)
          this.displaySuccess(`Asset ${chalk.yellow(assetId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerLinkedContents(ns: Command): void {
    ns.command('linked-contents')
      .description('list content entries that reference an asset')
      .argument('<spaceId>', 'space ID')
      .argument('<assetId>', 'asset ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, assetId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.assets.getLinkedContents(spaceId, assetId)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No linked contents')
          console.log(`\n${chalk.bold('Linked Contents:')}`)
          res.data.forEach((c) => console.log(`  ${chalk.yellow(c.id)}  ${(c as any).name ?? ''}`))
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerFoldersGroup(ns: Command): void {
    const folders = ns.command('folders').description('manage asset folders')

    folders.command('list')
      .description('list asset folders')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.assetFolders.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No folders found')
          console.log(`\n${chalk.bold('Asset Folders:')}`)
          res.data.forEach((f) => console.log(`  ${chalk.yellow(f.id)}  ${f.name}`))
        } catch (e: any) { this.handleError(e) }
      })

    folders.command('get')
      .description('get an asset folder')
      .argument('<spaceId>', 'space ID')
      .argument('<folderId>', 'folder ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, folderId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.assetFolders.get(spaceId, folderId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    folders.command('create')
      .description('create an asset folder')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'folder name')
      .option('--parent-id <parentId>', 'parent folder ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          if (!options.name) throw new Error('--name is required')
          const payload: any = { name: options.name }
          if (options.parentId) payload.parent_id = options.parentId
          const res = await this.client.assetFolders.create(spaceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Folder ${chalk.yellow(res.id)} created`)
        } catch (e: any) { this.handleError(e) }
      })

    folders.command('delete')
      .description('delete an asset folder')
      .argument('<spaceId>', 'space ID')
      .argument('<folderId>', 'folder ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, folderId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete folder ${chalk.yellow(folderId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.assetFolders.delete(spaceId, folderId)
          this.displaySuccess(`Folder ${chalk.yellow(folderId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerTagsGroup(ns: Command): void {
    const tags = ns.command('tags').description('manage asset tags')

    tags.command('list')
      .description('list asset tags')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.assetTags.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No tags found')
          console.log(`\n${chalk.bold('Asset Tags:')}`)
          res.data.forEach((t) => console.log(`  ${chalk.yellow(t.id)}  ${t.name}`))
        } catch (e: any) { this.handleError(e) }
      })

    tags.command('create')
      .description('create an asset tag')
      .argument('<spaceId>', 'space ID')
      .requiredOption('-n, --name <name>', 'tag name')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.assetTags.create(spaceId, { name: options.name })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Tag ${chalk.yellow(res.id)} created`)
        } catch (e: any) { this.handleError(e) }
      })

    tags.command('get')
      .description('get an asset tag')
      .argument('<spaceId>', 'space ID')
      .argument('<tagId>', 'tag ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, tagId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.assetTags.get(spaceId, tagId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    tags.command('delete')
      .description('delete an asset tag')
      .argument('<spaceId>', 'space ID')
      .argument('<tagId>', 'tag ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, tagId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete tag ${chalk.yellow(tagId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.assetTags.delete(spaceId, tagId)
          this.displaySuccess(`Tag ${chalk.yellow(tagId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }
}
