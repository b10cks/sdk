import type { Command } from 'commander'

import { ManagementClient } from '@b10cks/mgmt-client'
import chalk from 'chalk'

import credentials from '../utils/credentials.js'
import { ensureLoggedIn } from '../utils/refreshTokenIfNeeded.js'

const API_BASE_URL = process.env.B10CKS_API_DOMAIN || 'https://api.b10cks.com'

export abstract class BaseCommand {
  private _client: ManagementClient | null = null

  protected get client(): ManagementClient {
    if (!this._client) {
      const token = credentials.get()?.password ?? ''
      this._client = new ManagementClient({ baseUrl: API_BASE_URL, token })
    }
    return this._client
  }

  protected ensureAuthenticated(): void {
    ensureLoggedIn()
  }

  protected handleError(error: any): never {
    if (error?.message) {
      console.error(`${chalk.red('✖')} ${error.message}`)
    } else {
      console.error(`${chalk.red('✖')} An unexpected error occurred`)
    }
    process.exit(1)
  }

  protected displaySuccess(message: string): void {
    console.log(`${chalk.green('✓')} ${message}`)
  }

  protected outputJson(data: unknown): void {
    console.log(JSON.stringify(data, null, 2))
  }

  abstract register(program: Command): void
}
