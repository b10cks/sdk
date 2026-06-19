import type { Command } from 'commander'

import chalk from 'chalk'

import { BaseCommand } from './BaseCommand.js'

export class ContentsListCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('contents-list')
      .description('list content entries in a space')
      .argument('<spaceId>', 'Space ID')
      .option('--page <number>', 'Page number', '1')
      .option('--per-page <number>', 'Items per page', '25')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()

        try {
          const response = await this.service.listContents(spaceId)
          if (!response.data || response.data.length === 0) {
            console.log('No content entries found')
            return
          }

          console.log(`\n${chalk.bold('Content Entries:')}`)
          response.data.forEach((content) => {
            const isPublished = !!content.published_at
            const status = isPublished ? chalk.green('published') : chalk.yellow('draft')
            console.log(
              `${chalk.yellow(content.id)} ${chalk.bold(content.name ?? content.slug)} ${chalk.dim(content.slug)} ${status}`
            )
          })

          if ((response as any).meta) {
            const meta = (response as any).meta
            console.log(`\n${chalk.dim(`Page ${meta.current_page ?? 1} — Total: ${meta.total ?? response.data.length}`)}`)
          } else {
            console.log(`\n${chalk.dim(`Total: ${response.data.length}`)}`)
          }
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
