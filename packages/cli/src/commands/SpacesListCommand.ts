import type { Command } from 'commander'

import chalk from 'chalk'

import { BaseCommand } from './BaseCommand.js'

export class SpacesListCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('spaces-list')
      .description('list all available spaces')
      .action(async () => {
        this.ensureAuthenticated()

        try {
          const response = await this.service.listSpaces()
          if (!response.data || response.data.length === 0) {
            console.log('No spaces found')
            return
          }

          console.log(`\n${chalk.bold('Available Spaces:')}`)
          response.data.forEach((space) => {
            const state = space.state !== 'active' ? chalk.dim(` [${space.state}]`) : ''
            console.log(`${chalk.yellow(space.id)} ${space.name}${state}`)
          })
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
