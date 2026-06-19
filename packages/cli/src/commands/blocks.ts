import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class BlocksCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('blocks').description('manage block definitions')

    this.registerList(ns)
    this.registerCreate(ns)
    this.registerGet(ns)
    this.registerUpdate(ns)
    this.registerDelete(ns)
    this.registerTemplatesGroup(ns)
    this.registerVersionsGroup(ns)
  }

  private registerList(ns: Command): void {
    ns.command('list')
      .description('list all block definitions in a space')
      .argument('<spaceId>', 'space ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page', '100')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = { per_page: Number(options.perPage) }
          if (options.page) params.page = Number(options.page)
          const res = await this.client.blocks.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No blocks found')
          console.log(`\n${chalk.bold('Block Definitions:')}`)
          res.data.forEach((b) => {
            const type = b.type !== 'content' ? chalk.dim(` [${b.type}]`) : ''
            console.log(`  ${chalk.magenta(b.id)}  ${chalk.bold(b.name)}  ${chalk.dim(b.slug)}${type}`)
          })
          console.log(`\n${chalk.dim(`Total: ${res.data.length}`)}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerCreate(ns: Command): void {
    ns.command('create')
      .description('create a block definition')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'block name')
      .option('-s, --slug <slug>', 'block slug')
      .option('-t, --type <type>', 'block type (content|nestable)', 'content')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          let payload: any = {}
          if (options.interactive || !options.name) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'name', message: 'Block name:', default: options.name, validate: (v) => v ? true : 'Required' },
              { type: 'input', name: 'slug', message: 'Slug:', default: options.slug, validate: (v) => v ? true : 'Required' },
              { type: 'list', name: 'type', message: 'Type:', choices: ['content', 'nestable'], default: options.type },
            ])
            payload = answers
          } else {
            if (!options.name) throw new Error('--name is required')
            if (!options.slug) throw new Error('--slug is required')
            payload = { name: options.name, slug: options.slug, type: options.type }
          }
          const block = await this.client.blocks.create(spaceId, payload)
          if (options.json) return this.outputJson(block)
          console.log(`\n${chalk.green('✓')} Block created`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(block.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${block.name}`)
          console.log(`  ${chalk.bold('Slug:')} ${block.slug}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerGet(ns: Command): void {
    ns.command('get')
      .description('get a block definition')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, blockId, options) => {
        this.ensureAuthenticated()
        try {
          const block = await this.client.blocks.get(spaceId, blockId)
          if (options.json) return this.outputJson(block)
          console.log(`\n${chalk.bold('Block:')}`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(block.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${block.name}`)
          console.log(`  ${chalk.bold('Slug:')} ${block.slug}`)
          console.log(`  ${chalk.bold('Type:')} ${block.type}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerUpdate(ns: Command): void {
    ns.command('update')
      .description('update a block definition')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .option('-n, --name <name>', 'block name')
      .option('-s, --slug <slug>', 'block slug')
      .option('--json', 'output as JSON')
      .action(async (spaceId, blockId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: any = {}
          if (options.name) payload.name = options.name
          if (options.slug) payload.slug = options.slug
          const block = await this.client.blocks.update(spaceId, blockId, payload)
          if (options.json) return this.outputJson(block)
          this.displaySuccess(`Block ${chalk.yellow(block.id)} updated`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerDelete(ns: Command): void {
    ns.command('delete')
      .description('delete a block definition')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, blockId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete block ${chalk.yellow(blockId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.blocks.delete(spaceId, blockId)
          this.displaySuccess(`Block ${chalk.yellow(blockId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerTemplatesGroup(ns: Command): void {
    const tmpl = ns.command('templates').description('manage block templates')

    tmpl.command('list')
      .description('list templates for a block')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, blockId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.blocks.listTemplates(spaceId, blockId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No templates found')
          console.log(`\n${chalk.bold('Templates:')}`)
          res.data.forEach((t) => console.log(`  ${chalk.yellow(t.id)}  ${t.name}`))
        } catch (e: any) { this.handleError(e) }
      })

    tmpl.command('get')
      .description('get a block template')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .argument('<templateId>', 'template ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, blockId, templateId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blocks.getTemplate(spaceId, blockId, templateId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    tmpl.command('delete')
      .description('delete a block template')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .argument('<templateId>', 'template ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, blockId, templateId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete template ${chalk.yellow(templateId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.blocks.deleteTemplate(spaceId, blockId, templateId)
          this.displaySuccess(`Template ${chalk.yellow(templateId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerVersionsGroup(ns: Command): void {
    const ver = ns.command('versions').description('manage block versions')

    ver.command('list')
      .description('list versions of a block')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, blockId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.blocks.listVersions(spaceId, blockId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No versions found')
          console.log(`\n${chalk.bold('Versions:')}`)
          res.data.forEach((v) => console.log(`  ${chalk.yellow(v.id)}  ${chalk.dim((v as any).created_at ?? '')}`))
        } catch (e: any) { this.handleError(e) }
      })

    ver.command('get')
      .description('get a block version')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .argument('<versionId>', 'version ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, blockId, versionId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blocks.getVersion(spaceId, blockId, versionId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    ver.command('delete')
      .description('delete a block version')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .argument('<versionId>', 'version ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, blockId, versionId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete version ${chalk.yellow(versionId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.blocks.deleteVersion(spaceId, blockId, versionId)
          this.displaySuccess(`Version ${chalk.yellow(versionId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })

    ver.command('restore')
      .description('restore a block version')
      .argument('<spaceId>', 'space ID')
      .argument('<blockId>', 'block ID')
      .argument('<versionId>', 'version ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, blockId, versionId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.blocks.restoreVersion(spaceId, blockId, versionId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Version ${chalk.yellow(versionId)} restored`)
        } catch (e: any) { this.handleError(e) }
      })
  }
}
