import fs from 'node:fs'
import path from 'node:path'

import chalk from 'chalk'
import type { Command } from 'commander'
import inquirer from 'inquirer'

import type { KickstartFramework } from '../kickstart/templates.js'
import { KICKSTART_FRAMEWORKS, KICKSTART_LABELS, templateFiles } from '../kickstart/templates.js'
import { run } from '../utils/exec.js'
import type { PackageManager } from '../utils/project.js'
import { PACKAGE_MANAGERS, detectPackageManager, isEmptyDir } from '../utils/project.js'
import { BaseCommand } from './BaseCommand.js'

interface KickstartOptions {
  framework?: string
  name?: string
  pm?: string
  install: boolean
  yes?: boolean
  dryRun?: boolean
}

const DEFAULT_DIR = 'my-field-plugin'

export class KickstartCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('kickstart')
      .description('scaffold a b10cks field-plugin starter project')
      .argument('[dir]', 'target directory')
      .option('-f, --framework <name>', `framework (${KICKSTART_FRAMEWORKS.join('|')})`)
      .option('-n, --name <name>', 'plugin name (default: directory name)')
      .option('--pm <pm>', `package manager (${PACKAGE_MANAGERS.join('|')})`)
      .option('--no-install', 'write files but skip dependency install')
      .option('-y, --yes', 'accept defaults and never prompt')
      .option('--dry-run', 'print planned files without writing')
      .action(async (dir: string | undefined, options: KickstartOptions) => {
        try {
          await this.execute(dir, options)
        } catch (e) {
          this.handleError(e)
        }
      })
  }

  private async execute(dirArg: string | undefined, options: KickstartOptions): Promise<void> {
    const dryRun = Boolean(options.dryRun)

    if (
      options.framework &&
      !KICKSTART_FRAMEWORKS.includes(options.framework as KickstartFramework)
    ) {
      throw new Error(
        `Unknown framework "${options.framework}". Expected: ${KICKSTART_FRAMEWORKS.join(', ')}`
      )
    }
    if (options.pm && !PACKAGE_MANAGERS.includes(options.pm as PackageManager)) {
      throw new Error(
        `Unknown package manager "${options.pm}". Expected: ${PACKAGE_MANAGERS.join(', ')}`
      )
    }

    if (dryRun) console.log(chalk.dim('Dry run — nothing will be written.'))

    const dirName = dirArg ?? (await this.resolveDir(options))
    const dir = path.resolve(process.cwd(), dirName)

    if (!isEmptyDir(dir)) {
      throw new Error(`${dir} is not empty — kickstart scaffolds into an empty directory.`)
    }

    const framework = await this.resolveFramework(options)
    const name = options.name ?? this.titleCase(path.basename(dir))
    const pkgName = this.slugify(path.basename(dir))
    const pm = (options.pm as PackageManager | undefined) ?? detectPackageManager(process.cwd())

    console.log(
      `\n${chalk.bold('Framework:')} ${KICKSTART_LABELS[framework]}` +
        `  ${chalk.bold('Package manager:')} ${pm}`
    )

    const files = templateFiles(framework, { name, pkgName })
    this.writeFiles(dir, files, dryRun)

    await this.install(dir, pm, options, dryRun)
    this.printNextSteps(dirName, pm, options)
  }

  private async resolveDir(options: KickstartOptions): Promise<string> {
    if (options.yes) return DEFAULT_DIR

    const { dir } = await inquirer.prompt([
      {
        type: 'input',
        name: 'dir',
        message: 'Directory:',
        default: DEFAULT_DIR,
        validate: (value: string) => (value.trim().length > 0 ? true : 'Required'),
      },
    ])
    return dir.trim()
  }

  private async resolveFramework(options: KickstartOptions): Promise<KickstartFramework> {
    if (options.framework) return options.framework as KickstartFramework
    if (options.yes) throw new Error('Pass --framework together with --yes.')

    const { framework } = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Framework:',
        choices: KICKSTART_FRAMEWORKS.map((value) => ({ name: KICKSTART_LABELS[value], value })),
      },
    ])
    return framework
  }

  private writeFiles(dir: string, files: Record<string, string>, dryRun: boolean): void {
    const created = dryRun ? 'would create' : 'created'
    console.log()

    for (const [file, content] of Object.entries(files)) {
      if (!dryRun) {
        const target = path.join(dir, file)
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, content)
      }
      console.log(`${chalk.green('✓')} ${created} ${file}`)
    }
  }

  private async install(
    dir: string,
    pm: PackageManager,
    options: KickstartOptions,
    dryRun: boolean
  ): Promise<void> {
    if (options.install === false) {
      return console.log(chalk.dim(`\nSkipped install — run: ${pm} install`))
    }
    console.log(`\n${chalk.dim('$')} ${pm} install`)
    if (!dryRun) await run(pm, ['install'], dir)
  }

  private printNextSteps(dirName: string, pm: PackageManager, options: KickstartOptions): void {
    const runScript = pm === 'npm' ? 'npm run' : pm

    console.log(`\n${chalk.bold('Next:')}`)
    console.log(`  ${chalk.dim('→')} cd ${dirName}`)
    if (options.install === false) console.log(`  ${chalk.dim('→')} ${pm} install`)
    console.log(
      `  ${chalk.dim('→')} ${runScript} dev — use the URL as the plugin's ${chalk.bold('Dev URL')}` +
        ` (Settings → Field Plugins, development mode on)`
    )
    console.log(
      `  ${chalk.dim('→')} ${runScript} build — upload ${chalk.cyan('dist/plugin.js')} and publish`
    )
  }

  private titleCase(value: string): string {
    return value
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private slugify(value: string): string {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return slug || 'field-plugin'
  }
}
