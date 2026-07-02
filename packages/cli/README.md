# @b10cks/cli

[![npm version](https://img.shields.io/npm/v/@b10cks/cli.svg)](https://www.npmjs.com/package/@b10cks/cli)
[![npm downloads](https://img.shields.io/npm/dt/@b10cks/cli.svg)](https://www.npmjs.com/package/@b10cks/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Command-line interface for the b10cks headless CMS. Powered by [`@b10cks/mgmt-client`](../mgmt-client).

## Installation

```bash
# npm
npm install -g @b10cks/cli

# pnpm
pnpm add -g @b10cks/cli

# bun
bun add -g @b10cks/cli
```

Or run without installing:

```bash
npx @b10cks/cli <command>
bunx @b10cks/cli <command>
```

## Authentication

### Login

```sh
b10cks login
```

Prompts for a personal access token (PAT). The token is stored in `~/.netrc` (created with `0600` permissions so it is not world-readable) and used for all subsequent commands. To create a PAT, visit your account security settings. If an existing `~/.netrc` cannot be parsed, `login`/`logout` abort rather than overwrite it, so credentials for other hosts are never lost.

### Logout

```sh
b10cks logout
```

Clears the stored token from `~/.netrc`.

### Environment variables

You can bypass `.netrc` by setting:

```sh
B10CKS_LOGIN=sanctum B10CKS_TOKEN=<your-token> b10cks spaces-list
```

A custom API domain (self-hosted or staging) can be set via `B10CKS_API_DOMAIN` (defaults to `https://api.b10cks.com`). It is read at runtime, so it works with the published binary.

## Commands

### Spaces

#### `spaces-list`

List all spaces in your workspace.

```sh
b10cks spaces-list
```

#### `spaces-create`

Create a new space. Prompts interactively if `--name` or `--slug` are omitted.

```sh
b10cks spaces-create --name "My Space" --slug "my-space"
b10cks spaces-create --name "My Space" --slug "my-space" --team-id <teamId>
b10cks spaces-create --interactive
```

| Option                            | Description                        |
| --------------------------------- | ---------------------------------- |
| `-n, --name <name>`               | Space name (required)              |
| `-s, --slug <slug>`               | URL-friendly identifier (required) |
| `-t, --team-id <teamId>`          | Assign to a team                   |
| `-d, --description <description>` | Space description                  |
| `-i, --icon <icon>`               | Space icon                         |
| `-c, --color <color>`             | Hex color (`#RRGGBB` or `#RGB`)    |
| `--interactive`                   | Prompt for all fields              |

#### `spaces-hierarchy`

Display the full workspace tree — teams and their spaces — with color coding.

```sh
b10cks spaces-hierarchy
```

Teams are shown in blue, spaces in yellow.

### Teams

#### `teams-list`

List all teams with their IDs and parent relationships.

```sh
b10cks teams-list
```

#### `teams-create`

Create a new team.

```sh
b10cks teams-create --name "Engineering"
b10cks teams-create --name "Backend" --parent-id <parentTeamId> --color "#0066FF"
b10cks teams-create --interactive
```

| Option                            | Description                         |
| --------------------------------- | ----------------------------------- |
| `-n, --name <name>`               | Team name, max 100 chars (required) |
| `-d, --description <description>` | Team description                    |
| `-i, --icon <icon>`               | Icon/emoji, max 50 chars            |
| `-c, --color <color>`             | Hex color (`#RRGGBB` or `#RGB`)     |
| `-p, --parent-id <parentId>`      | Parent team ID (creates a subteam)  |
| `--interactive`                   | Prompt for all fields               |

#### `teams-hierarchy`

Display the team tree. Uses the API's native hierarchy endpoint.

```sh
b10cks teams-hierarchy
```

### Blocks

#### `blocks-list`

List all block definitions in a space.

```sh
b10cks blocks-list <spaceId>
```

Shows each block's ID, name, slug, and type.

### Contents

#### `contents-list`

List content entries in a space with their publish status.

```sh
b10cks contents-list <spaceId>
```

### Releases

#### `releases-list`

List releases in a space with their status (draft / committed / published).

```sh
b10cks releases-list <spaceId>
```

### Data Sources

#### `data-sources-entries-create`

Create a new entry in a data source.

```sh
# Positional arguments
b10cks data-sources-entries-create <spaceId> <dataSourceId> --key "country" --value "Austria"

# Named options
b10cks data-sources-entries-create \
  --space-id <spaceId> \
  --data-source-id <dataSourceId> \
  --key "timezone" \
  --value "Europe/Vienna"

# Interactive
b10cks data-sources-entries-create <spaceId> <dataSourceId> --interactive
```

| Option                                | Description              |
| ------------------------------------- | ------------------------ |
| `-s, --space-id <spaceId>`            | Space ID                 |
| `-d, --data-source-id <dataSourceId>` | Data source ID           |
| `-k, --key <key>`                     | Entry key                |
| `-v, --value <value>`                 | Entry value              |
| `--interactive`                       | Prompt for key and value |

### Development

#### `generate-types`

Generate TypeScript type definitions from block schemas in a space.

```sh
b10cks generate-types <spaceId>
b10cks generate-types <spaceId> --out ./src/b10cks/types
```

Writes `generated.d.ts` and `index.d.ts` to the output directory (default: `./b10cks/types`). The generated interfaces cover all field types including rich text, assets, links, options, nested blocks, tables, and meta.

## Help

```sh
b10cks --help
b10cks <command> --help
b10cks --version
```

## Architecture

The CLI is part of the `@b10cks/sdk` monorepo and uses `@b10cks/mgmt-client` for all API interactions.

```
src/
  commands/   # One class per command, all extend BaseCommand
  services/   # Service.ts wraps ManagementClient; TypeGeneratorService handles codegen
  utils/      # credentials.ts (netrc), refreshTokenIfNeeded.ts (auth guard)
```

Each command delegates to `Service`, which holds a `ManagementClient` instance initialized from the stored token. New commands follow the pattern: add a method to `Service.ts`, create a `*Command.ts`, export from `commands/index.ts`, and register in `src/index.ts`.
