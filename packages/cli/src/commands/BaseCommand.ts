import type { Command } from 'commander'

import chalk from 'chalk'

import Service from '../services/Service.js'
import { displayTokenInfo, ensureLoggedIn } from '../utils/refreshTokenIfNeeded.js'

export abstract class BaseCommand {
  protected service: Service

  constructor() {
    this.service = new Service()
  }

  protected ensureAuthenticated(): void {
    ensureLoggedIn()
  }

  protected handleError(error: any): void {
    console.error(`${chalk.red('✖')} Error: ${error.message}`)
    process.exit(1)
  }

  protected displaySuccess(message: string): void {
    console.log(`${chalk.green('✓')} ${message}`)
  }

  protected displayTokenInfo(): void {
    displayTokenInfo()
  }

  abstract register(program: Command): void
}
