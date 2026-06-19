import type { Command } from 'commander'

import { ManagementClient } from '@b10cks/mgmt-client'
import chalk from 'chalk'
import inquirer from 'inquirer'

import credentials from '../utils/credentials.js'

const API_BASE_URL = process.env.B10CKS_API_DOMAIN || 'https://api.b10cks.com'

export function registerAuthCommands(program: Command): void {
  program
    .command('login')
    .description('authenticate with b10cks using a personal access token')
    .action(async () => {
      const baseUrl = API_BASE_URL.replace('/api', '').replace(/\/+$/, '')
      const settingsUrl = `${baseUrl}/account/settings/security`

      console.log()
      console.log(chalk.yellow('To create a personal access token:'))
      console.log(chalk.gray(`  1. Visit: ${chalk.cyan(settingsUrl)}`))
      console.log(chalk.gray('  2. Create a new personal access token'))
      console.log(chalk.gray('  3. Copy the token and paste it below'))
      console.log()

      const { token } = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Personal access token:',
          validate: (value) => (value.trim().length > 0 ? true : 'Please enter a valid token'),
        },
      ])

      try {
        const client = new ManagementClient({ baseUrl: API_BASE_URL, token: token.trim() })
        await client.users.getMe()
        credentials.set({ login: 'sanctum', password: token.trim() })
        console.log(`${chalk.green('✓')} Authenticated successfully! Token stored in ~/.netrc`)
      } catch {
        console.error(`${chalk.red('✖')} Authentication failed. Please check your token.`)
        process.exit(1)
      }
    })

  program
    .command('logout')
    .description('remove stored credentials')
    .action(() => {
      credentials.clear()
      console.log(`${chalk.green('✓')} Logged out successfully.`)
    })
}
