import type {
  CreateContentParams,
  MoveContentParams,
  PaginationParams,
  UpdateContentParams,
} from '@b10cks/mgmt-client'
import chalk from 'chalk'
import type { Command } from 'commander'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class ContentsCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('contents').description('manage content entries')

    this.registerList(ns)
    this.registerCreate(ns)
    this.registerGet(ns)
    this.registerUpdate(ns)
    this.registerDelete(ns)
    this.registerPublish(ns)
    this.registerUnpublish(ns)
    this.registerSchedule(ns)
    this.registerMove(ns)
    this.registerVersionsGroup(ns)
  }

  private registerList(ns: Command): void {
    ns.command('list')
      .description('list content entries in a space')
      .argument('<spaceId>', 'space ID')
      .option('--block <blockSlug>', 'filter by block slug')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page', '25')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = { per_page: Number(options.perPage) }
          if (options.block) params.block = options.block
          if (options.page) params.page = Number(options.page)
          const res = await this.client.contents.list(spaceId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No content entries found')
          console.log(`\n${chalk.bold('Contents:')}`)
          res.data.forEach((c) => {
            const status = c.published_at ? chalk.green(' [published]') : chalk.dim(' [draft]')
            console.log(
              `  ${chalk.yellow(c.id)}  ${chalk.bold(c.name)}  ${chalk.dim(c.slug ?? '')}${status}`
            )
          })
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerCreate(ns: Command): void {
    ns.command('create')
      .description('create a content entry')
      .argument('<spaceId>', 'space ID')
      .option('-n, --name <name>', 'content name')
      .option('-s, --slug <slug>', 'content slug')
      .option('-b, --block-id <blockId>', 'block ID to use')
      .option('--parent-id <parentId>', 'parent content ID')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          let payload: CreateContentParams
          if (options.interactive || !options.name || !options.blockId || !options.slug) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'name',
                message: 'Content name:',
                default: options.name,
                validate: (v) => (v ? true : 'Required'),
              },
              {
                type: 'input',
                name: 'slug',
                message: 'Slug:',
                default: options.slug,
                validate: (v) => (v ? true : 'Required'),
              },
              {
                type: 'input',
                name: 'block_id',
                message: 'Block ID:',
                default: options.blockId,
                validate: (v) => (v ? true : 'Required'),
              },
              {
                type: 'input',
                name: 'parent_id',
                message: 'Parent content ID (optional):',
                default: options.parentId || '',
              },
            ])
            payload = { name: answers.name, slug: answers.slug, block_id: answers.block_id }
            if (answers.parent_id) payload.parent_id = answers.parent_id
          } else {
            payload = { name: options.name, slug: options.slug, block_id: options.blockId }
            if (options.parentId) payload.parent_id = options.parentId
          }
          const content = await this.client.contents.create(spaceId, payload)
          if (options.json) return this.outputJson(content)
          console.log(`\n${chalk.green('✓')} Content created`)
          console.log(`  ${chalk.bold('ID:')}   ${chalk.yellow(content.id)}`)
          console.log(`  ${chalk.bold('Name:')} ${content.name}`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerGet(ns: Command): void {
    ns.command('get')
      .description('get a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const content = await this.client.contents.get(spaceId, contentId)
          if (options.json) return this.outputJson(content)
          console.log(`\n${chalk.bold('Content:')}`)
          console.log(`  ${chalk.bold('ID:')}    ${chalk.yellow(content.id)}`)
          console.log(`  ${chalk.bold('Name:')}  ${content.name}`)
          console.log(`  ${chalk.bold('Slug:')}  ${content.slug ?? ''}`)
          console.log(`  ${chalk.bold('Block:')} ${content.block ?? ''}`)
          const status = content.published_at ? chalk.green('published') : chalk.dim('draft')
          console.log(`  ${chalk.bold('Status:')} ${status}`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerUpdate(ns: Command): void {
    ns.command('update')
      .description('update a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('-n, --name <name>', 'content name')
      .option('-s, --slug <slug>', 'content slug')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: UpdateContentParams = {}
          if (options.name) payload.name = options.name
          if (options.slug) payload.slug = options.slug
          const content = await this.client.contents.update(spaceId, contentId, payload)
          if (options.json) return this.outputJson(content)
          this.displaySuccess(`Content ${chalk.yellow(content.id)} updated`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerDelete(ns: Command): void {
    ns.command('delete')
      .description('delete a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete content ${chalk.yellow(contentId)}?`,
              default: false,
            },
          ])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.contents.delete(spaceId, contentId)
          this.displaySuccess(`Content ${chalk.yellow(contentId)} deleted`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerPublish(ns: Command): void {
    ns.command('publish')
      .description('publish a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const content = await this.client.contents.publish(spaceId, contentId)
          if (options.json) return this.outputJson(content)
          this.displaySuccess(`Content ${chalk.yellow(contentId)} published`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerUnpublish(ns: Command): void {
    ns.command('unpublish')
      .description('unpublish a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const content = await this.client.contents.unpublish(spaceId, contentId)
          if (options.json) return this.outputJson(content)
          this.displaySuccess(`Content ${chalk.yellow(contentId)} unpublished`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerSchedule(ns: Command): void {
    ns.command('schedule')
      .description('schedule a content entry for publishing')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .requiredOption('--publish-at <datetime>', 'publish date/time (ISO 8601)')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const content = await this.client.contents.schedule(spaceId, contentId, {
            scheduled_at: options.publishAt,
          })
          if (options.json) return this.outputJson(content)
          this.displaySuccess(
            `Content ${chalk.yellow(contentId)} scheduled for ${options.publishAt}`
          )
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerMove(ns: Command): void {
    ns.command('move')
      .description('move a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('--parent-id <parentId>', 'new parent content ID')
      .option('--position <position>', 'position in parent')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: MoveContentParams = {} as MoveContentParams
          if (options.parentId !== undefined) payload.parent_id = options.parentId
          if (options.position !== undefined) payload.position = Number(options.position)
          const content = await this.client.contents.move(spaceId, contentId, payload)
          if (options.json) return this.outputJson(content)
          this.displaySuccess(`Content ${chalk.yellow(contentId)} moved`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private registerVersionsGroup(ns: Command): void {
    const ver = ns.command('versions').description('manage content versions')

    ver
      .command('list')
      .description('list versions of a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.contents.listVersions(spaceId, contentId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No versions found')
          console.log(`\n${chalk.bold('Versions:')}`)
          res.data.forEach((v) => {
            console.log(
              `  ${chalk.yellow(v.id)}  ${chalk.dim(v.created_at ?? '')}  ${v.message ? chalk.dim(`"${v.message}"`) : ''}`
            )
          })
        } catch (e) {
          this.handleError(e)
        }
      })

    ver
      .command('get')
      .description('get a content version')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<versionId>', 'version ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, versionId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.contents.getVersion(spaceId, contentId, versionId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })

    ver
      .command('publish')
      .description('publish a specific version')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<versionId>', 'version ID')
      .action(async (spaceId, contentId, versionId) => {
        this.ensureAuthenticated()
        try {
          await this.client.contents.publishVersion(spaceId, contentId, versionId)
          this.displaySuccess(`Version ${chalk.yellow(versionId)} published`)
        } catch (e) {
          this.handleError(e)
        }
      })

    ver
      .command('set-current')
      .description('set a version as the current draft')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<versionId>', 'version ID')
      .action(async (spaceId, contentId, versionId) => {
        this.ensureAuthenticated()
        try {
          await this.client.contents.setVersionAsCurrent(spaceId, contentId, versionId)
          this.displaySuccess(`Version ${chalk.yellow(versionId)} set as current`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }
}
