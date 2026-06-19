import type { Command } from 'commander'

import type { CreateSpaceParams } from '@b10cks/mgmt-client'
import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class SpacesCreateCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('spaces-create')
      .description('create a new space')
      .option('-n, --name <name>', 'Space name (required)')
      .option('-s, --slug <slug>', 'Space slug (required)')
      .option('-t, --team-id <teamId>', 'Team ID to assign the space to')
      .option('-d, --description <description>', 'Space description')
      .option('-i, --icon <icon>', 'Space icon')
      .option('-c, --color <color>', 'Space color (hex format: #RRGGBB or #RGB)')
      .option('--interactive', 'Interactive mode (prompt for inputs)', false)
      .action(async (options) => {
        this.ensureAuthenticated()

        try {
          const payload =
            options.interactive || !options.name || !options.slug
              ? await this.promptForSpaceData(options)
              : this.buildPayload(options)

          const space = await this.service.createSpace(payload)

          console.log(`\n${chalk.green('✓')} Space created successfully!`)
          console.log(`${chalk.bold('ID:')} ${chalk.yellow(space.id)}`)
          console.log(`${chalk.bold('Name:')} ${space.name}`)
          console.log(`${chalk.bold('Slug:')} ${space.slug}`)
          if (space.team_id) {
            console.log(`${chalk.bold('Team ID:')} ${space.team_id}`)
          }
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }

  private async promptForSpaceData(options: any): Promise<CreateSpaceParams> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Space name:',
        default: options.name,
        validate: (value) => {
          if (!value || value.length === 0) return 'Space name is required'
          return true
        },
      },
      {
        type: 'input',
        name: 'slug',
        message: 'Space slug (URL-friendly identifier):',
        default: options.slug,
        validate: (value) => {
          if (!value || value.length === 0) return 'Space slug is required'
          if (!/^[a-z0-9-]+$/.test(value)) return 'Slug may only contain lowercase letters, numbers, and hyphens'
          return true
        },
      },
      {
        type: 'input',
        name: 'team_id',
        message: 'Team ID (optional):',
        default: options.teamId || '',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description (optional):',
        default: options.description || '',
      },
    ])

    const payload: CreateSpaceParams = { name: answers.name, slug: answers.slug }
    if (answers.team_id) payload.team_id = answers.team_id
    if (answers.description) payload.description = answers.description
    return payload
  }

  private buildPayload(options: any): CreateSpaceParams {
    if (!options.name) throw new Error('Space name is required (use --name or --interactive)')
    if (!options.slug) throw new Error('Space slug is required (use --slug or --interactive)')

    const payload: CreateSpaceParams = { name: options.name, slug: options.slug }
    if (options.teamId) payload.team_id = options.teamId
    if (options.description) payload.description = options.description
    if (options.icon) payload.icon = options.icon
    if (options.color) payload.color = options.color
    return payload
  }
}
