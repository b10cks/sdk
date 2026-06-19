import type { Command } from 'commander'

import chalk from 'chalk'

import { BaseCommand } from './BaseCommand.js'

export class ReleasesListCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('releases-list')
      .description('list releases in a space')
      .argument('<spaceId>', 'Space ID')
      .action(async (spaceId) => {
        this.ensureAuthenticated()

        try {
          const response = await this.service.listReleases(spaceId)
          if (!response.data || response.data.length === 0) {
            console.log('No releases found')
            return
          }

          console.log(`\n${chalk.bold('Releases:')}`)
          response.data.forEach((release) => {
            const status = release.published_at
              ? chalk.green('published')
              : release.committed_at
                ? chalk.blue('committed')
                : chalk.yellow('draft')
            const versions = release.versions_count != null
              ? chalk.dim(` (${release.versions_count} versions)`)
              : ''
            console.log(`${chalk.magenta(release.id)} ${chalk.bold(release.name)} ${status}${versions}`)
          })
          console.log(`\n${chalk.dim(`Total: ${response.data.length}`)}`)
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
