import type { Command } from 'commander'

import chalk from 'chalk'

import type { SpacesHierarchyNode } from '../services/Service.js'
import { BaseCommand } from './BaseCommand.js'

export class SpacesHierarchyCommand extends BaseCommand {
  private renderSpacesHierarchy(
    node: SpacesHierarchyNode,
    prefix: string = '',
    isLast: boolean = true
  ): string {
    const connector = isLast ? '└─ ' : '├─ '
    const lines: string[] = []

    const displayText =
      node.type === 'team'
        ? `${chalk.blue(node.id)} ${node.name}`
        : `${chalk.yellow(node.id)} ${node.name}`

    lines.push(`${prefix}${connector}${displayText}`)

    if (node.children && node.children.length > 0) {
      const extension = isLast ? '   ' : '│  '
      node.children.forEach((child, index) => {
        const isLastChild = index === node.children!.length - 1
        lines.push(this.renderSpacesHierarchy(child, prefix + extension, isLastChild))
      })
    }

    return lines.join('\n')
  }

  register(program: Command): void {
    program
      .command('spaces-hierarchy')
      .description('display the spaces and teams hierarchy')
      .action(async () => {
        this.ensureAuthenticated()

        try {
          const hierarchy = await this.service.buildSpacesHierarchy()
          if (!hierarchy) {
            console.log('No teams or spaces found')
            return
          }

          console.log(`\n${chalk.bold('Spaces & Teams Hierarchy:')}`)
          console.log(this.renderSpacesHierarchy(hierarchy))
          console.log(`\n${chalk.dim('Legend:')} ${chalk.blue('Team')}, ${chalk.yellow('Space')}`)
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
