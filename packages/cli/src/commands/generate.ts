import type { Command } from 'commander'

import chalk from 'chalk'

import { readDefinitions, resolveSchemaDir } from '../schema/store.js'
import { TypesGeneratorService } from '../services/TypeGeneratorService.js'
import { BaseCommand } from './BaseCommand.js'

export class GenerateCommand extends BaseCommand {
  register(program: Command): void {
    const ns = program.command('generate').description('code generation utilities')

    ns.command('types')
      .description('generate TypeScript types from block definitions')
      .argument('[spaceId]', 'space ID to generate types for (omit to use local schema files)')
      .option('-o, --out <path>', 'output path for generated types', './b10cks/types')
      .option('--dir <path>', 'local schema directory used when no space ID is given', './b10cks/schema')
      .action(async (spaceId, options) => {
        try {
          const service = new TypesGeneratorService(options.out)

          if (spaceId) {
            this.ensureAuthenticated()
            console.log(`\n${chalk.bold('Generating types for space:')} ${chalk.cyan(spaceId)}`)
            console.log(`${chalk.dim('Output path:')} ${options.out}\n`)
            await service.generate(spaceId)
            return
          }

          const dir = resolveSchemaDir(options.dir)
          const definitions = readDefinitions(dir, { requireExternalId: false })
          if (definitions.length === 0) {
            return this.handleError(
              new Error(`No *.block.json files in ${dir} — pass a space ID or run \`b10cks schema pull\` first`)
            )
          }

          console.log(`\n${chalk.bold('Generating types from local schema:')} ${chalk.cyan(dir)}`)
          console.log(`${chalk.dim('Output path:')} ${options.out}\n`)
          service.generateFromDefinitions(definitions)
        } catch (e: any) { this.handleError(e) }
      })
  }
}
