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
  BlocksListCommand,
  ContentsListCommand,
  DataSourcesEntriesCreateCommand,
  GenerateTypesCommand,
  LoginCommand,
  LogoutCommand,
  ReleasesListCommand,
  SpacesCreateCommand,
  SpacesHierarchyCommand,
  SpacesListCommand,
  TeamsCreateCommand,
  TeamsHierarchyCommand,
  TeamsListCommand,
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

const commands = [
  new LoginCommand(),
  new LogoutCommand(),
  new SpacesListCommand(),
  new SpacesCreateCommand(),
  new SpacesHierarchyCommand(),
  new TeamsListCommand(),
  new TeamsCreateCommand(),
  new TeamsHierarchyCommand(),
  new BlocksListCommand(),
  new ContentsListCommand(),
  new ReleasesListCommand(),
  new DataSourcesEntriesCreateCommand(),
  new GenerateTypesCommand(),
]

commands.forEach((command) => command.register(program))

program.parse(process.argv)
