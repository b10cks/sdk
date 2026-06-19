#!/usr/bin/env node
import fs from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'path'

import chalk from 'chalk'
import { Command } from 'commander'
import figlet from 'figlet'
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
  ProviderCommand,
  RedirectsCommand,
  ReleasesCommand,
  SpacesCommand,
  SystemCommand,
  TeamsCommand,
  TokensCommand,
  UsersCommand,
  registerAuthCommands,
} from './commands/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rawPkg = fs.readFileSync(path.join(__dirname, '../package.json'))
const pkg = JSON.parse(rawPkg.toString())
const program = new Command()

updateNotifier({ pkg }).notify({ isGlobal: true })

program
  .addHelpText('beforeAll', chalk.blueBright(figlet.textSync('b10cks', { font: 'small' })))
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
  new ProviderCommand(),
  new RedirectsCommand(),
  new ReleasesCommand(),
  new SpacesCommand(),
  new SystemCommand(),
  new TeamsCommand(),
  new TokensCommand(),
  new UsersCommand(),
]

namespaceCommands.forEach((cmd) => cmd.register(program))

program.parse(process.argv)
