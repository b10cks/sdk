import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class LoginCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('login')
      .description('authenticate with b10cks using a personal access token')
      .action(async () => {
        const apiDomain = process.env.B10CKS_API_DOMAIN || 'https://api.b10cks.com'
        const baseUrl = apiDomain.replace('/api', '').replace(/\/+$/, '')
        const settingsUrl = `${baseUrl}/account/settings/security`

        console.log()
        console.log(chalk.yellow('📝 To create a personal access token:'))
        console.log(chalk.gray(`1. Visit: ${chalk.cyan(settingsUrl)}`))
        console.log(chalk.gray('2. Create a new personal access token'))
        console.log(chalk.gray('3. Copy the token and paste it below'))
        console.log()

        const content = await inquirer.prompt([
          {
            type: 'password',
            name: 'token',
            message: 'Personal access token:',
            validate: (value) => {
              if (value.trim().length > 0) return true
              return 'Please enter a valid token'
            },
          },
        ])

        try {
          if (await this.service.login(content.token.trim())) {
            this.displaySuccess(
              'Authenticated successfully! Personal access token is stored in your .netrc file.'
            )
          } else {
            console.error(`${chalk.red('✖')} Authentication failed. Please check your token.`)
            process.exit(1)
          }
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
