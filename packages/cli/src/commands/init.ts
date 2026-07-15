import type { Command } from 'commander'

import fs from 'node:fs'
import path from 'node:path'

import chalk from 'chalk'
import { downloadTemplate } from 'giget'
import inquirer from 'inquirer'

import type { Changes, ManualStep } from '../init/wiring.js'
import type { EnvResult } from '../init/env.js'
import type { Framework, PackageManager } from '../utils/project.js'

import { ensureGitignored, envDefines, upsertEnv } from '../init/env.js'
import {
  DEFAULT_API_URL,
  FRAMEWORK_LABELS,
  FRAMEWORK_PACKAGES,
  scaffoldCommand,
  tokenEnv,
} from '../init/frameworks.js'
import { wireFramework } from '../init/wiring.js'
import { TypesGeneratorService } from '../services/TypeGeneratorService.js'
import credentials from '../utils/credentials.js'
import { run } from '../utils/exec.js'
import {
  FRAMEWORKS,
  PACKAGE_MANAGERS,
  detectFramework,
  detectPackageManager,
  installArgs,
  isEmptyDir,
  isSvelteKit,
  isTypeScript,
} from '../utils/project.js'
import { BaseCommand } from './BaseCommand.js'

interface InitOptions {
  framework?: string
  template?: string
  space?: string
  token?: string
  pm?: string
  install: boolean
  types?: boolean
  yes?: boolean
  dryRun?: boolean
}

interface ResolvedToken {
  /** Null when an existing `.env` token is reused and nothing was minted. */
  token: string | null
  spaceId?: string
}

interface Prepared {
  framework: Framework
  /** False when a dry run skipped the scaffold, so the directory is not real yet. */
  materialized: boolean
}

const API_URL = process.env.B10CKS_API_URL || DEFAULT_API_URL

export class InitCommand extends BaseCommand {
  register(program: Command): void {
    program
      .command('init')
      .description('set up b10cks in this project, or scaffold a new one')
      .argument('[dir]', 'target directory', '.')
      .option('-f, --framework <name>', `framework (${FRAMEWORKS.join('|')})`)
      .option('-T, --template <ref>', 'scaffold from a giget ref instead of the official scaffolder')
      .option('-s, --space <spaceId>', 'space to link')
      .option('-t, --token <token>', 'access token (default: create one, or prompt)')
      .option('--pm <pm>', `package manager (${PACKAGE_MANAGERS.join('|')})`)
      .option('--no-install', 'write files but skip dependency install')
      .option('--types', 'generate TypeScript types after wiring')
      .option('-y, --yes', 'accept defaults and never prompt')
      .option('--dry-run', 'print planned changes without writing')
      .action(async (dir: string, options: InitOptions) => {
        try {
          await this.execute(dir, options)
        } catch (e: any) { this.handleError(e) }
      })
  }

  private async execute(dirArg: string, options: InitOptions): Promise<void> {
    const dir = path.resolve(process.cwd(), dirArg)
    const dryRun = Boolean(options.dryRun)

    if (options.framework && !FRAMEWORKS.includes(options.framework as Framework)) {
      throw new Error(`Unknown framework "${options.framework}". Expected: ${FRAMEWORKS.join(', ')}`)
    }
    if (options.pm && !PACKAGE_MANAGERS.includes(options.pm as PackageManager)) {
      throw new Error(`Unknown package manager "${options.pm}". Expected: ${PACKAGE_MANAGERS.join(', ')}`)
    }

    if (dryRun) console.log(chalk.dim('Dry run — nothing will be written.'))

    const { framework, materialized } = await this.prepare(dir, options, dryRun)
    const pm = (options.pm as PackageManager | undefined) ?? detectPackageManager(dir)
    const { svelteKit, typescript } = this.projectTraits(dir, framework, materialized)

    console.log(
      `\n${chalk.bold('Framework:')} ${FRAMEWORK_LABELS[framework]}` +
        `  ${chalk.bold('Package manager:')} ${pm}`
    )

    const env = tokenEnv(framework, svelteKit)
    // Resolving mints a token server-side, so skip it entirely when .env
    // already has one — otherwise every re-run would orphan a fresh token.
    const reuseExisting = !options.token && envDefines(dir, env.publicVar)
    const { token, spaceId } = reuseExisting
      ? { token: null, spaceId: options.space }
      : await this.resolveToken(dir, options, dryRun)

    // Persist the token before installing: a mint is irreversible and the value
    // is shown only once, so an install failure must not strand it.
    const gitignored = ensureGitignored(dir, dryRun)
    const envResult: EnvResult = token
      ? upsertEnv(
          dir,
          Object.fromEntries([env.publicVar, ...env.extraVars].map((name) => [name, token])),
          dryRun
        )
      : { written: [], present: [env.publicVar] }

    await this.install(dir, pm, framework, options, dryRun)

    const changes = await wireFramework({
      dir,
      framework,
      apiUrl: API_URL,
      dryRun,
      svelteKit,
      typescript,
    })

    this.report(changes, envResult, gitignored, dryRun)

    if (options.types && spaceId && !dryRun) {
      console.log(`\n${chalk.bold('Generating types…')}`)
      await new TypesGeneratorService(path.join(dir, 'b10cks', 'types')).generate(spaceId)
    }

    this.printNextSteps(dirArg, spaceId, options)
  }

  /** Resolves the framework, scaffolding a new project first when needed. */
  private async prepare(dir: string, options: InitOptions, dryRun: boolean): Promise<Prepared> {
    const detected = fs.existsSync(dir) ? detectFramework(dir) : null

    if (options.template) {
      if (!isEmptyDir(dir)) {
        throw new Error(`${dir} is not empty — --template scaffolds into an empty directory.`)
      }
      await this.scaffoldTemplate(options.template, dir, dryRun)
      const framework = detectFramework(dir) ?? (await this.resolveFramework(options))
      return { framework, materialized: !dryRun }
    }

    if (detected) return { framework: detected, materialized: true }

    if (!isEmptyDir(dir)) {
      if (options.framework) return { framework: options.framework as Framework, materialized: true }
      throw new Error(
        `No supported framework detected in ${dir}, and it is not empty.\n` +
          '  Pass --framework to wire it up anyway, or target an empty directory to scaffold.'
      )
    }

    const framework = await this.resolveFramework(options)
    await this.scaffoldOfficial(framework, dir, options, dryRun)
    return { framework, materialized: !dryRun }
  }

  /**
   * Traits are read from the project on disk. A dry run skips the scaffold, so
   * there is nothing to read — fall back to what our scaffolders would produce:
   * `sv create` yields SvelteKit, and every official template is TypeScript.
   */
  private projectTraits(
    dir: string,
    framework: Framework,
    materialized: boolean
  ): { svelteKit: boolean; typescript: boolean } {
    return materialized
      ? { svelteKit: isSvelteKit(dir), typescript: isTypeScript(dir) }
      : { svelteKit: framework === 'svelte', typescript: true }
  }

  private async scaffoldTemplate(template: string, dir: string, dryRun: boolean): Promise<void> {
    console.log(`\n${chalk.bold('Scaffolding from')} ${chalk.cyan(template)}`)
    if (dryRun) return
    // `force` only skips giget's own emptiness check, which counts dotfiles and
    // would reject a lone `.git`; isEmptyDir already gated this. It deletes
    // nothing — that is `forceClean`, which removes the directory outright.
    await downloadTemplate(template, { dir, force: true })
  }

  private async scaffoldOfficial(
    framework: Framework,
    dir: string,
    options: InitOptions,
    dryRun: boolean
  ): Promise<void> {
    const pm = (options.pm as PackageManager | undefined) ?? detectPackageManager(process.cwd())
    const [command, args] = scaffoldCommand(framework, pm, path.basename(dir))

    console.log(`\n${chalk.bold('Scaffolding')} ${FRAMEWORK_LABELS[framework]}`)
    console.log(`${chalk.dim('$')} ${command} ${args.join(' ')}`)
    if (dryRun) return

    // Official scaffolders create the target directory themselves.
    fs.mkdirSync(path.dirname(dir), { recursive: true })
    await run(command, args, path.dirname(dir))
  }

  private async resolveFramework(options: InitOptions): Promise<Framework> {
    if (options.framework) return options.framework as Framework
    if (options.yes) throw new Error('Could not detect a framework — pass --framework with --yes.')

    const { framework } = await inquirer.prompt([{
      type: 'list',
      name: 'framework',
      message: 'Framework:',
      choices: FRAMEWORKS.map((value) => ({ name: FRAMEWORK_LABELS[value], value })),
    }])
    return framework
  }

  private async install(
    dir: string,
    pm: PackageManager,
    framework: Framework,
    options: InitOptions,
    dryRun: boolean
  ): Promise<void> {
    const packages = FRAMEWORK_PACKAGES[framework]
    const [command, args] = installArgs(pm, packages)

    if (options.install === false) {
      return console.log(chalk.dim(`\nSkipped install — run: ${command} ${args.join(' ')}`))
    }
    console.log(`\n${chalk.dim('$')} ${command} ${args.join(' ')}`)
    if (!dryRun) await run(command, args, dir)
  }

  private async resolveToken(
    dir: string,
    options: InitOptions,
    dryRun: boolean
  ): Promise<ResolvedToken> {
    if (options.token) return { token: options.token, spaceId: options.space }

    // Minting is a real server-side side effect — never do it on a dry run.
    if (dryRun) return { token: '<access-token>', spaceId: options.space }

    const authenticated = Boolean(credentials.get()?.password)

    if (options.yes) {
      if (!authenticated || !options.space) {
        throw new Error(
          '--yes needs --token, or --space together with a logged-in session (`b10cks login`).'
        )
      }
      return { token: await this.mintToken(dir, options.space), spaceId: options.space }
    }

    if (authenticated) {
      const spaceId = options.space ?? (await this.pickSpace())
      if (spaceId) return { token: await this.mintToken(dir, spaceId), spaceId }
    }

    const { token } = await inquirer.prompt([{
      type: 'password',
      name: 'token',
      message: 'b10cks access token:',
      validate: (value: string) => (value.trim().length > 0 ? true : 'Required'),
    }])
    return { token: token.trim(), spaceId: options.space }
  }

  private async mintToken(dir: string, spaceId: string): Promise<string> {
    const name = `${path.basename(path.resolve(dir))} (local)`
    const created = await this.client.tokens.create(spaceId, { name })
    console.log(`${chalk.green('✓')} Created access token ${chalk.bold(name)}`)
    return created.token
  }

  private async pickSpace(): Promise<string | null> {
    const response = await this.client.spaces.list()
    const spaces = response.data ?? []
    if (!spaces.length) return null

    const { spaceId } = await inquirer.prompt([{
      type: 'list',
      name: 'spaceId',
      message: 'Space:',
      choices: spaces.map((space) => ({
        name: `${space.name} ${chalk.dim(space.slug)}`,
        value: space.id,
      })),
    }])
    return spaceId
  }

  private report(changes: Changes, env: EnvResult, gitignored: boolean, dryRun: boolean): void {
    const created = dryRun ? 'would create' : 'created'
    const updated = dryRun ? 'would update' : 'updated'

    console.log()
    changes.created.forEach((file) => console.log(`${chalk.green('✓')} ${created} ${file}`))
    changes.edited.forEach((file) => console.log(`${chalk.green('✓')} ${updated} ${file}`))
    changes.skipped.forEach((file) =>
      console.log(chalk.dim(`• ${file} already wired — left unchanged`))
    )
    if (env.written.length) {
      console.log(`${chalk.green('✓')} ${updated} .env ${chalk.dim(env.written.join(', '))}`)
    }
    env.present.forEach((key) =>
      console.log(chalk.dim(`• .env already defines ${key} — left unchanged`))
    )
    if (gitignored) console.log(`${chalk.green('✓')} ${updated} .gitignore ${chalk.dim('.env')}`)

    changes.manual.forEach((step) => this.printManualStep(step))
  }

  private printManualStep(step: ManualStep): void {
    console.log(`\n${chalk.yellow('⚠')} ${chalk.bold(step.file)} — could not wire automatically, add:`)
    console.log(step.snippet.split('\n').map((line) => `    ${chalk.cyan(line)}`).join('\n'))
  }

  private printNextSteps(dirArg: string, spaceId: string | undefined, options: InitOptions): void {
    const steps: string[] = []
    if (dirArg !== '.') steps.push(`cd ${dirArg}`)
    if (options.install === false) steps.push('install dependencies')
    if (!options.types) {
      steps.push(`b10cks generate types ${spaceId ?? '<spaceId>'}`)
    }
    if (!steps.length) return

    console.log(`\n${chalk.bold('Next:')}`)
    steps.forEach((step) => console.log(`  ${chalk.dim('→')} ${step}`))
  }
}
