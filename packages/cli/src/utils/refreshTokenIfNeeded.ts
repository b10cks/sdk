import chalk from 'chalk'

import credentials from './credentials.js'

export function ensureLoggedIn(): void {
  const creds = credentials.get()
  if (!creds?.password) {
    console.error(
      `${chalk.red('✖')} Not authenticated. Please login first with: ${chalk.cyan('b10cks login')}`
    )
    process.exit(1)
  }
}

export function displayTokenInfo(): void {
  const creds = credentials.get()
  if (creds?.login && creds?.password) {
    console.log(chalk.gray('Personal access token stored in .netrc'))
  }
}
