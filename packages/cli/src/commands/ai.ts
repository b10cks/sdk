import chalk from 'chalk'
import type { Command } from 'commander'

import { BaseCommand } from './BaseCommand.js'

export class AiCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('ai').description('AI utilities')

    ns.command('models')
      .description('list available AI models')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const res = await this.client.ai.getAvailableModels()
          if (options.json) return this.outputJson(res)
          if (!res.data?.length) return console.log('No AI models available')
          console.log(`\n${chalk.bold('Available AI Models:')}`)
          res.data.forEach((m) => {
            console.log(
              `  ${chalk.yellow(m.id)}  ${chalk.bold(m.name ?? m.id)}  ${chalk.dim(m.provider ?? '')}`
            )
          })
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('translate')
      .description('translate content with AI')
      .requiredOption('--text <text>', 'text to translate')
      .requiredOption('--target <locale>', 'target locale (e.g. de, fr, es)')
      .option('--source <locale>', 'source locale (auto-detected if omitted)')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const payload: Record<string, unknown> = {
            text: options.text,
            target_locale: options.target,
          }
          if (options.source) payload.source_locale = options.source
          const res = await this.client.ai.translate(payload)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })

    ns.command('meta-tags')
      .description('generate SEO meta tags with AI')
      .requiredOption('--title <title>', 'page title')
      .requiredOption('--content <content>', 'page content or description')
      .option('--locale <locale>', 'locale (e.g. en)')
      .option('--json', 'output as JSON')
      .action(async (options) => {
        this.ensureAuthenticated()
        try {
          const payload: Record<string, unknown> = {
            title: options.title,
            content: options.content,
          }
          if (options.locale) payload.locale = options.locale
          const res = await this.client.ai.generateMetaTags(payload)
          if (options.json) return this.outputJson(res)
          console.log(JSON.stringify(res, null, 2))
        } catch (e) {
          this.handleError(e)
        }
      })
  }
}
