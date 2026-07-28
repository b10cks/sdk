import type { CreateProviderNoteParams, UpdateProviderNoteParams } from '@b10cks/mgmt-client'
import chalk from 'chalk'
import type { Command } from 'commander'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'

export class ProviderCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('provider').description('provider-level management')

    ns.command('stats')
      .description('get provider-level statistics')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.provider.getStats()
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })

    const notes = ns.command('notes').description('manage provider notes')

    notes
      .command('list')
      .description('list provider notes')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.provider.listNotes()
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No notes found')
          console.log(`\n${chalk.bold('Provider Notes:')}`)
          res.data.forEach((n) => {
            console.log(
              `  ${chalk.yellow(n.id)}  ${chalk.bold(n.title ?? '')}  ${chalk.dim(n.created_at ?? '')}`
            )
          })
        } catch (e) {
          this.handleError(e)
        }
      })

    notes
      .command('get')
      .description('get a provider note')
      .argument('<noteId>', 'note ID')
      .option('--json', 'output as JSON')
      .action(async (noteId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.provider.getNote(noteId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })

    notes
      .command('create')
      .description('create a provider note')
      .option('-t, --title <title>', 'note title')
      .option('-b, --body <body>', 'note body')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          let title = options.title
          let body = options.body
          if (options.interactive || !title) {
            const answers = await inquirer.prompt([
              {
                type: 'input',
                name: 'title',
                message: 'Title:',
                default: title,
                validate: (v) => (v ? true : 'Required'),
              },
              { type: 'input', name: 'body', message: 'Body:', default: body },
            ])
            title = answers.title
            body = answers.body
          }
          if (!title) throw new Error('--title is required')
          const payload: CreateProviderNoteParams = { title }
          if (body) payload.content = body
          const res = await this.client.provider.createNote(payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Note ${chalk.yellow(res.data.id)} created`)
        } catch (e) {
          this.handleError(e)
        }
      })

    notes
      .command('update')
      .description('update a provider note')
      .argument('<noteId>', 'note ID')
      .option('-t, --title <title>', 'new title')
      .option('-b, --body <body>', 'new body')
      .option('--json', 'output as JSON')
      .action(async (noteId, options) => {
        this.ensureAuthenticated()
        try {
          const payload: UpdateProviderNoteParams = {}
          if (options.title) payload.title = options.title
          if (options.body) payload.content = options.body
          const res = await this.client.provider.updateNote(noteId, payload)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Note ${chalk.yellow(noteId)} updated`)
        } catch (e) {
          this.handleError(e)
        }
      })

    notes
      .command('delete')
      .description('delete a provider note')
      .argument('<noteId>', 'note ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (noteId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Delete note ${chalk.yellow(noteId)}?`,
              default: false,
            },
          ])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.provider.deleteNote(noteId)
          this.displaySuccess(`Note ${chalk.yellow(noteId)} deleted`)
        } catch (e) {
          this.handleError(e)
        }
      })
  }
}
