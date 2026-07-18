#!/usr/bin/env node
import fs from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'path'

import chalk from 'chalk'
import { Command } from 'commander'
import updateNotifier from 'update-notifier'

import {
  AiCommand,
  AssetsCommand,
  AutomationsCommand,
  BlockFoldersCommand,
  BlockTagsCommand,
  BlocksCommand,
  CommentsCommand,
  ContentsCommand,
  DataSourcesCommand,
  GenerateCommand,
  InitCommand,
  KickstartCommand,
  ProviderCommand,
  RedirectsCommand,
  SchemaCommand,
  ReleasesCommand,
  SpacesCommand,
  SystemCommand,
  TeamsCommand,
  TokensCommand,
  UsersCommand,
  registerAuthCommands,
} from './commands/index.js'

// Rendered once with figlet's `small` font. Kept literal because figlet loads
// fonts from disk at runtime, and the published package ships only `dist/**` —
// bundling inlines its code but not the .flf files, so it threw on every run.
const BANNER = [
  '  _    _  __     _       ',
  " | |__/ |/  \\ __| |__ ___",
  " | '_ \\ | () / _| / /(_-<",
  ' |_.__/_|\\__/\\__|_\\_\\/__/',
  '                         ',
].join('\n')

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawPkg = fs.readFileSync(path.join(__dirname, '../package.json'))
const pkg = JSON.parse(rawPkg.toString())
const program = new Command()

updateNotifier({ pkg }).notify({ isGlobal: true })

program
  .addHelpText('beforeAll', chalk.blueBright(BANNER))
  .configureHelp({ sortSubcommands: true })
  .version(pkg.version)

registerAuthCommands(program)

const namespaceCommands = [
  new AiCommand(),
  new AssetsCommand(),
  new AutomationsCommand(),
  new BlockFoldersCommand(),
  new BlockTagsCommand(),
  new BlocksCommand(),
  new CommentsCommand(),
  new ContentsCommand(),
  new DataSourcesCommand(),
  new GenerateCommand(),
  new InitCommand(),
  new KickstartCommand(),
  new ProviderCommand(),
  new RedirectsCommand(),
  new SchemaCommand(),
  new ReleasesCommand(),
  new SpacesCommand(),
  new SystemCommand(),
  new TeamsCommand(),
  new TokensCommand(),
  new UsersCommand(),
]

namespaceCommands.forEach((cmd) => cmd.register(program))

program.parse(process.argv)
