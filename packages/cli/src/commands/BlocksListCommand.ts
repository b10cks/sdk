import type { Command } from 'commander'

import chalk from 'chalk'

import { BaseCommand } from './BaseCommand.js'

export class BlocksListCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('blocks-list')
      .description('list all block definitions in a space')
      .argument('<spaceId>', 'Space ID')
      .action(async (spaceId) => {
        this.ensureAuthenticated()

        try {
          const response = await this.service.listBlocks(spaceId)
          if (!response.data || response.data.length === 0) {
            console.log('No blocks found')
            return
          }

          console.log(`\n${chalk.bold('Block Definitions:')}`)
          response.data.forEach((block) => {
            const type = block.type !== 'content' ? chalk.dim(` [${block.type}]`) : ''
            console.log(`${chalk.magenta(block.id)} ${chalk.bold(block.name)} ${chalk.dim(block.slug)}${type}`)
          })
          console.log(`\n${chalk.dim(`Total: ${response.data.length}`)}`)
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
