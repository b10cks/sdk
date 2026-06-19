import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class ReleasesCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('releases').description('manage releases')

    ns.command('list')
      .description('list releases in a space')
      .argument('<spaceId>', 'space ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.releases.list(spaceId)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No releases found')
          console.log(`\n${chalk.bold('Releases:')}`)
          res.data.forEach((r) => {
            const status = (r as any).status ?? ''
            const statusColor = status === 'published' ? chalk.green(status) : chalk.dim(status)
            console.log(`  ${chalk.yellow(r.id)}  ${chalk.bold(r.name)}  ${statusColor}`)
          })
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('create')
      .description('create a release')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'release name')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          let name = options.name
          if (options.interactive || !name) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'name', message: 'Release name:', default: name, validate: (v) => v ? true : 'Required' },
            ])
            name = answers.name
          }
          if (!name) throw new Error('--name is required')
          const res = await this.client.releases.create(spaceId, { name })
          if (options.json) return this.outputJson(res)
          console.log(`\n${chalk.green('✓')} Release created`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(res.data.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${res.data.name}`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('get')
      .description('get a release')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.releases.get(spaceId, releaseId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('update')
      .description('update a release')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .requiredOption('-n, --name <name>', 'new release name')
      .option('--json', 'output as JSON')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.releases.update(spaceId, releaseId, { name: options.name })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Release ${chalk.yellow(res.data.id)} updated`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('delete')
      .description('delete a release')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete release ${chalk.yellow(releaseId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.releases.delete(spaceId, releaseId)
          this.displaySuccess(`Release ${chalk.yellow(releaseId)} deleted`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('commit')
      .description('commit a release (lock it for publishing)')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.releases.commit(spaceId, releaseId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Release ${chalk.yellow(releaseId)} committed`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('publish')
      .description('publish a release')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.releases.publish(spaceId, releaseId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Release ${chalk.yellow(releaseId)} published`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('cancel')
      .description('cancel a release')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.releases.cancel(spaceId, releaseId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Release ${chalk.yellow(releaseId)} cancelled`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('assign-version')
      .description('assign a content version to a release')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .requiredOption('--content-id <contentId>', 'content entry ID')
      .requiredOption('--version-id <versionId>', 'content version ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.releases.assignVersion(spaceId, releaseId, {
            content_id: options.contentId,
            version_id: options.versionId,
          } as any)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Version assigned to release ${chalk.yellow(releaseId)}`)
        } catch (e: any) { this.handleError(e) }
      })

    ns.command('remove-version')
      .description('remove a content version from a release')
      .argument('<spaceId>', 'space ID')
      .argument('<releaseId>', 'release ID')
      .requiredOption('--content-id <contentId>', 'content entry ID')
      .option('-f, --force', 'skip confirmation')
      .option('--json', 'output as JSON')
      .action(async (spaceId, releaseId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Remove content ${chalk.yellow(options.contentId)} from release ${chalk.yellow(releaseId)}?`,
            default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          const res = await this.client.releases.removeVersion(spaceId, releaseId, {
            content_id: options.contentId,
          } as any)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Version removed from release ${chalk.yellow(releaseId)}`)
        } catch (e: any) { this.handleError(e) }
      })
  }
}
