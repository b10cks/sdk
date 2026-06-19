import type { Command } from 'commander'

import { BaseCommand } from './BaseCommand.js'

export class LogoutCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('logout')
      .description('logout from b10cks')
      .action(async () => {
        try {
          await this.service.logout()
          this.displaySuccess('Logged out successfully')
        } catch (error: any) {
          this.handleError(error)
        }
      })
  }
}
