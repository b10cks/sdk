import type { Command } from 'commander'

import type { TeamHierarchy } from '@b10cks/mgmt-client'
import chalk from 'chalk'

import { BaseCommand } from './BaseCommand.js'

export class TeamsHierarchyCommand extends BaseCommand {
  private renderTeamTree(
    node: TeamHierarchy,
    prefix: string = '',
    isLast: boolean = true
  ): string {
    const connector = isLast ? '└─ ' : '├─ '
    const lines: string[] = []

    lines.push(`${prefix}${connector}${chalk.cyan(node.id)} ${node.name}`)

    if (node.children && node.children.length > 0) {
      const extension = isLast ? '   ' : '│  '
      node.children.forEach((child, index) => {
        const isLastChild = index === node.children.length - 1
        lines.push(this.renderTeamTree(child, prefix + extension, isLastChild))
      })
    }

    return lines.join('\n')
  }

  register(program: Command): void {
    program
      .command('teams-hierarchy')
      .description('display the team hierarchy')
      .action(async () => {
        this.ensureAuthenticated()

        try {
          const hierarchy = await this.service.buildTeamsHierarchy()
          if (!hierarchy) {
            console.log('No teams found')
            return
          }

          console.log(`\n${chalk.bold('Teams Hierarchy:')}`)
          console.log(this.renderTeamTree(hierarchy))
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
