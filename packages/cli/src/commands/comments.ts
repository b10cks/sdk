import type { Command } from 'commander'

import chalk from 'chalk'
import inquirer from 'inquirer'

import { BaseCommand } from './BaseCommand.js'
import type { PaginationParams } from '@b10cks/mgmt-client'

export class CommentsCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('comments').description('manage content comments')

    ns.command('list')
      .description('list comments on a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.comments.list(spaceId, contentId, params)
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No comments found')
          console.log(`\n${chalk.bold('Comments:')}`)
          res.data.forEach((c) => {
            const resolved = c.resolved_at ? chalk.dim(' [resolved]') : ''
            console.log(`  ${chalk.yellow(c.id)}  ${chalk.dim(c.created_at ?? '')}${resolved}`)
            if (c.body) console.log(`    ${c.body}`)
          })
        } catch (e) { this.handleError(e) }
      })

    ns.command('create')
      .description('add a comment to a content entry')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .option('-b, --body <body>', 'comment body')
      .option('-i, --interactive', 'prompt for inputs')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, options) => {
        this.ensureAuthenticated()
        try {
          let body = options.body
          if (options.interactive || !body) {
            const answers = await inquirer.prompt([
              { type: 'input', name: 'body', message: 'Comment:', default: body, validate: (v) => v ? true : 'Required' },
            ])
            body = answers.body
          }
          if (!body) throw new Error('--body is required')
          const res = await this.client.comments.create(spaceId, contentId, { body })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Comment ${chalk.yellow(res.data.id)} added`)
        } catch (e) { this.handleError(e) }
      })

    ns.command('get')
      .description('get a comment')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, commentId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.comments.get(spaceId, contentId, commentId)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res.data, null, 2))
        } catch (e) { this.handleError(e) }
      })

    ns.command('update')
      .description('update a comment')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .option('-b, --body <body>', 'new comment body')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, commentId, options) => {
        this.ensureAuthenticated()
        try {
          if (!options.body) throw new Error('--body is required')
          const res = await this.client.comments.update(spaceId, contentId, commentId, { body: options.body })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Comment ${chalk.yellow(commentId)} updated`)
        } catch (e) { this.handleError(e) }
      })

    ns.command('delete')
      .description('delete a comment')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .option('-f, --force', 'skip confirmation')
      .action(async (spaceId, contentId, commentId, options) => {
        this.ensureAuthenticated()
        if (!options.force) {
          const { confirm } = await inquirer.prompt([{
            type: 'confirm', name: 'confirm',
            message: `Delete comment ${chalk.yellow(commentId)}?`, default: false,
          }])
          if (!confirm) return console.log('Aborted')
        }
        try {
          await this.client.comments.delete(spaceId, contentId, commentId)
          this.displaySuccess(`Comment ${chalk.yellow(commentId)} deleted`)
        } catch (e) { this.handleError(e) }
      })

    ns.command('resolve')
      .description('mark a comment as resolved')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, commentId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.comments.resolve(spaceId, contentId, commentId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Comment ${chalk.yellow(commentId)} resolved`)
        } catch (e) { this.handleError(e) }
      })

    ns.command('unresolve')
      .description('mark a comment as unresolved')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, commentId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.comments.unresolve(spaceId, contentId, commentId)
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Comment ${chalk.yellow(commentId)} unresolved`)
        } catch (e) { this.handleError(e) }
      })

    const reactions = ns.command('reactions').description('manage comment reactions')

    reactions.command('list')
      .description('list reactions on a comment')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .option('-p, --page <page>', 'page number')
      .option('--per-page <n>', 'results per page')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, commentId, options) => {
        this.ensureAuthenticated()
        try {
          const params: PaginationParams = {}
          if (options.perPage) params.per_page = Number(options.perPage)
          if (options.page) params.page = Number(options.page)
          const res = await this.client.comments.listReactions(spaceId, contentId, commentId, { query: params })
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No reactions')
          console.log(`\n${chalk.bold('Reactions:')}`)
          res.data.forEach((r) => console.log(`  ${r.emoji}  ${r.author?.name ?? ''}`))
        } catch (e) { this.handleError(e) }
      })

    reactions.command('add')
      .description('add a reaction to a comment')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .requiredOption('-e, --emoji <emoji>', 'emoji reaction')
      .option('--json', 'output as JSON')
      .action(async (spaceId, contentId, commentId, options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.comments.addReaction(spaceId, contentId, commentId, { emoji: options.emoji })
          if (options.json) return this.outputJson(res)
          this.displaySuccess(`Reaction added`)
        } catch (e) { this.handleError(e) }
      })

    reactions.command('remove')
      .description('remove your reaction from a comment')
      .argument('<spaceId>', 'space ID')
      .argument('<contentId>', 'content ID')
      .argument('<commentId>', 'comment ID')
      .action(async (spaceId, contentId, commentId) => {
        this.ensureAuthenticated()
        try {
          await this.client.comments.removeReaction(spaceId, contentId, commentId)
          this.displaySuccess('Reaction removed')
        } catch (e) { this.handleError(e) }
      })
  }
}
