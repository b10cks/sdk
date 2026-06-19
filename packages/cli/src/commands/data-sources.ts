import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class DataSourcesCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('data-sources').description('manage data sources')

    this.registerList(ns)
    this.registerCreate(ns)
    this.registerGet(ns)
    this.registerUpdate(ns)
    this.registerDelete(ns)
    this.registerEntriesGroup(ns)
  }

  private registerList(ns: Command): void {
    ns.command('list')
      .description('list data sources in a space')
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
          const res = await this.client.dataSources.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No data sources found')
          console.log(`\n${chalk.bold('Data Sources:')}`)
          res.data.forEach((ds) => console.log(`  ${chalk.yellow(ds.id)}  ${chalk.bold(ds.name)}  ${chalk.dim(ds.slug ?? '')}`))
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerCreate(ns: Command): void {
    ns.command('create')
      .description('create a data source')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'data source name')
      .option('-s, --slug <slug>', 'data source slug')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          let payload: any = {}
          if (options.interactive || !options.name) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'name', message: 'Data source name:', default: options.name, validate: (v) => v ? true : 'Required' },
              { type: 'input', name: 'slug', message: 'Slug:', default: options.slug },
            ])
            payload = { name: answers.name }
            if (answers.slug) payload.slug = answers.slug
          } else {
            if (!options.name) throw new Error('--name is required')
            payload = { name: options.name }
            if (options.slug) payload.slug = options.slug
          }
          const ds = await this.client.dataSources.create(spaceId, payload)
          if (options.json) return this.outputJson(ds)
          console.log(`\n${chalk.green('✓')} Data source created`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(ds.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${ds.name}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerGet(ns: Command): void {
    ns.command('get')
      .description('get a data source')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        try {
          const ds = await this.client.dataSources.get(spaceId, dataSourceId)
          if (options.json) return this.outputJson(ds)
          console.log(`\n${chalk.bold('Data Source:')}`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(ds.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${ds.name}`)
          console.log(`  ${chalk.bold('Slug:')} ${ds.slug ?? ''}`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerUpdate(ns: Command): void {
    ns.command('update')
      .description('update a data source')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .option('-n, --name <name>', 'new name')
      .option('-s, --slug <slug>', 'new slug')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: any = {}
          if (options.name) payload.name = options.name
          if (options.slug) payload.slug = options.slug
          const ds = await this.client.dataSources.update(spaceId, dataSourceId, payload)
          if (options.json) return this.outputJson(ds)
          this.displaySuccess(`Data source ${chalk.yellow(ds.id)} updated`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerDelete(ns: Command): void {
    ns.command('delete')
      .description('delete a data source')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete data source ${chalk.yellow(dataSourceId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.dataSources.delete(spaceId, dataSourceId)
          this.displaySuccess(`Data source ${chalk.yellow(dataSourceId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private registerEntriesGroup(ns: Command): void {
    const entries = ns.command('entries').description('manage data source entries')

    entries.command('list')
      .description('list entries in a data source')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: any = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.dataSources.listEntries(spaceId, dataSourceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No entries found')
          console.log(`\n${chalk.bold('Data Source Entries:')}`)
          res.data.forEach((e) => {
            console.log(`  ${chalk.yellow(e.id)}  ${chalk.bold(e.name ?? '')}  ${chalk.dim(e.value ?? '')}`)
          })
        } catch (e: any) { this.handleError(e) }
      })

    entries.command('create')
      .description('create an entry in a data source')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .option('-n, --name <name>', 'entry name')
      .option('-v, --value <value>', 'entry value')
      .option('-d, --dimension <dimension>', 'dimension value')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        try {
          let payload: any = {}
          if (options.interactive || !options.name) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'name', message: 'Entry name:', default: options.name, validate: (v) => v ? true : 'Required' },
              { type: 'input', name: 'value', message: 'Value:', default: options.value },
              { type: 'input', name: 'dimension', message: 'Dimension (optional):', default: options.dimension || '' },
            ])
            payload = { name: answers.name, value: answers.value }
            if (answers.dimension) payload.dimension_value = answers.dimension
          } else {
            if (!options.name) throw new Error('--name is required')
            payload = { name: options.name, value: options.value }
            if (options.dimension) payload.dimension_value = options.dimension
          }
          const entry = await this.client.dataSources.createEntry(spaceId, dataSourceId, payload)
          if (options.json) return this.outputJson(entry)
          console.log(`\n${chalk.green('✓')} Entry created`)
          console.log(`  ${chalk.bold('ID:')}    ${chalk.yellow(entry.id)}`)
          console.log(`  ${chalk.bold('Name:')}  ${entry.name ?? ''}`)
          console.log(`  ${chalk.bold('Value:')} ${entry.value ?? ''}`)
        } catch (e: any) { this.handleError(e) }
      })

    entries.command('get')
      .description('get a data source entry')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .argument('<entryId>', 'entry ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, entryId, options) => {
        this.ensureAuthenticated()
        try {
          const entry = await this.client.dataSources.getEntry(spaceId, dataSourceId, entryId)
          if (options.json) return this.outputJson(entry)
          console.log(JSON.stringify(entry, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    entries.command('update')
      .description('update a data source entry')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .argument('<entryId>', 'entry ID')
      .option('-n, --name <name>', 'new name')
      .option('-v, --value <value>', 'new value')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, entryId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: any = {}
          if (options.name) payload.name = options.name
          if (options.value) payload.value = options.value
          const entry = await this.client.dataSources.updateEntry(spaceId, dataSourceId, entryId, payload)
          if (options.json) return this.outputJson(entry)
          this.displaySuccess(`Entry ${chalk.yellow(entry.id)} updated`)
        } catch (e: any) { this.handleError(e) }
      })

    entries.command('delete')
      .description('delete a data source entry')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .argument('<entryId>', 'entry ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, dataSourceId, entryId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete entry ${chalk.yellow(entryId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.dataSources.deleteEntry(spaceId, dataSourceId, entryId)
          this.displaySuccess(`Entry ${chalk.yellow(entryId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })

    entries.command('export')
      .description('export data source entries as JSON')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.dataSources.exportEntries(spaceId, dataSourceId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    entries.command('import')
      .description('import entries into a data source (pass payload via --data)')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .requiredOption('--data <json>', 'JSON payload (e.g. \'{"entries":[...]}\')')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload = JSON.parse(options.data)
          const res = await this.client.dataSources.importEntries(spaceId, dataSourceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess('Entries imported')
          if (res) console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    entries.command('translate')
      .description('AI-translate missing locale dimensions in a data source')
      .argument('<spaceId>', 'space ID')
      .argument('<dataSourceId>', 'data source ID')
      .option('--locale <locale>', 'target locale to translate into')
      .option('--json', 'output as JSON')
      .action(async (spaceId, dataSourceId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: Record<string, unknown> = {}
          if (options.locale) payload.locale = options.locale
          const res = await this.client.dataSources.translateMissingDimensions(spaceId, dataSourceId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess('Translation started')
          if (res) console.log(JSON.stringify(res, null, 2))
        } catch (e: any) { this.handleError(e) }
      })
  }
}
