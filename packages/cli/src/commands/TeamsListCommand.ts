import type { Command } from 'commander'

import chalk from 'chalk'

import { BaseCommand } from './BaseCommand.js'

export class TeamsListCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('teams-list')
      .description('list all available teams')
      .action(async () => {
        this.ensureAuthenticated()

        try {
          const response = await this.service.listTeams()
          if (!response.data || response.data.length === 0) {
            console.log('No teams found')
            return
          }

          console.log(`\n${chalk.bold('Available Teams:')}`)
          response.data.forEach((team) => {
            const parent = team.parent_id ? chalk.dim(` (parent: ${team.parent_id})`) : ''
            console.log(`${chalk.cyan(team.id)} ${team.name}${parent}`)
          })
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
