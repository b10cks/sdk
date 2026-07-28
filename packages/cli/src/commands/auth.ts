import { ManagementApiError, ManagementClient } from '@b10cks/mgmt-client'
import chalk from 'chalk'
import type { Command } from 'commander'
import inquirer from 'inquirer'

import credentials from '../utils/credentials.js'

const API_BASE_URL = process.env.B10CKS_API_DOMAIN || 'https://api.b10cks.com'

/**
 * Derives the account/dashboard base URL from the API base URL by stripping a
 * leading `api.` host label (e.g. `https://api.b10cks.com` → `https://b10cks.com`).
 * Falls back to the input if it is not a parseable URL.
 */
function accountBaseUrl(apiBaseUrl: string): string {
  try {
    const url = new URL(apiBaseUrl)
    url.hostname = url.hostname.replace(/^api\./, '')
    url.pathname = url.pathname.replace(/\/?api\/?$/, '')
    return url.toString().replace(/\/+$/, '')
  } catch {
    return apiBaseUrl.replace(/\/+$/, '')
  }
}

export function registerAuthCommands(program: Command): void {
  program
    .command('login')
    .description('authenticate with b10cks using a personal access token')
    .action(async () => {
      const settingsUrl = accountBaseUrl(API_BASE_URL) + '/account/settings/security'

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
      } catch (error) {
        if (
          error instanceof ManagementApiError &&
          (error.statusCode === 401 || error.statusCode === 403)
        ) {
          console.error(`${chalk.red('✖')} Authentication failed. Please check your token.`)
        } else {
          const message = error instanceof Error ? error.message : String(error)
          console.error(`${chalk.red('✖')} Could not reach ${API_BASE_URL}: ${message}`)
        }
        process.exit(1)
      }

      try {
        credentials.set({ login: 'sanctum', password: token.trim() })
        console.log(`${chalk.green('✓')} Authenticated successfully! Token stored in ~/.netrc`)
      } catch (error) {
        console.error(`${chalk.red('✖')} ${error instanceof Error ? error.message : String(error)}`)
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
