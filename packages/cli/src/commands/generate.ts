import type { Command } from 'commander'

import chalk from 'chalk'

import { TypesGeneratorService } from '../services/TypeGeneratorService.js'
import { BaseCommand } from './BaseCommand.js'

export class GenerateCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('generate').description('code generation utilities')

    ns.command('types')
      .description('generate TypeScript types from block definitions')
      .argument('<spaceId>', 'space ID to generate types for')
      .option('-o, --out <path>', 'output path for generated types', './b10cks/types')
      .action(async (spaceId, options) => {
        this.ensureAuthenticated()
        try {
          console.log(`\n${chalk.bold('Generating types for space:')} ${chalk.cyan(spaceId)}`)
          console.log(`${chalk.dim('Output path:')} ${options.out}\n`)
          const service = new TypesGeneratorService(options.out)
          await service.generate(spaceId)
        } catch (e: any) { this.handleError(e) }
      })
  }
}
