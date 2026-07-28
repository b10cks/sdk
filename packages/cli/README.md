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

## Quick start

```sh
b10cks login          # store a personal access token
b10cks init           # wire b10cks into the current project
b10cks init my-app    # or scaffold a new project first
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
B10CKS_LOGIN=sanctum B10CKS_TOKEN=<your-token> b10cks spaces list
```

| Variable            | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `B10CKS_LOGIN`      | Login for the Management API (use `sanctum` with a PAT) |
| `B10CKS_TOKEN`      | Personal access token, bypassing `~/.netrc`             |
| `B10CKS_API_DOMAIN` | Management API host (default `https://api.b10cks.com`)  |
| `B10CKS_API_URL`    | Content API URL written by `init` (default `…/api`)     |

Both are read at runtime, so they work with the published binary.

## `init`

Sets up b10cks in a project. `init` detects the framework in `[dir]` (default: the
current directory) and wires it up; if the directory is empty it scaffolds a new
project first, then wires that.

```sh
b10cks init                                            # integrate into this project
b10cks init my-app --framework nuxt                    # scaffold, then integrate
b10cks init my-app --template gh:b10cks/nuxt-boilerplate
b10cks init --dry-run                                  # preview, write nothing
```

| Option                   | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| `-f, --framework <name>` | `nuxt`, `next`, `react`, `vue`, or `svelte` (skips detection)       |
| `-T, --template <ref>`   | Scaffold from any [giget](https://github.com/unjs/giget) ref        |
| `-s, --space <spaceId>`  | Space to link (default: pick from a list)                           |
| `-t, --token <token>`    | Access token (default: create one, or prompt)                       |
| `--pm <pm>`              | `npm`, `pnpm`, `yarn`, or `bun` (default: detected from lockfile)   |
| `--no-install`           | Write files but skip installing dependencies                        |
| `--types`                | Run `generate types` after wiring                                   |
| `-y, --yes`              | Never prompt (for CI); needs `--token`, or `--space` when logged in |
| `--dry-run`              | Print planned changes without writing                               |

### Supported frameworks

Detection uses `package.json` dependencies and config files. Meta-frameworks win
over the UI library they build on, so a Nuxt app is never mistaken for Vue.

| Framework | Packages installed                                           | Wiring                                                    |
| --------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Nuxt      | `@b10cks/nuxt @b10cks/vue @b10cks/client @b10cks/richtext`   | `modules` + `b10cks` block in `nuxt.config.ts`            |
| Next.js   | `@b10cks/next @b10cks/react @b10cks/client @b10cks/richtext` | `withB10cks()` in `next.config.ts` + a provider component |
| React     | `@b10cks/react @b10cks/client @b10cks/richtext`              | Provider component, wrapped around your app               |
| Vue       | `@b10cks/vue @b10cks/client @b10cks/richtext`                | `app.use(B10cksVue, …)` in `src/main.ts`                  |
| Svelte    | `@b10cks/svelte @b10cks/client @b10cks/richtext`             | `createB10cksContext(…)` snippet                          |

### Scaffolding

With no `--template`, `init` delegates to the framework's own official scaffolder
(`create-nuxt`, `create-next-app`, `create-vite`, `sv create`) and then wires the
result. Pass `--template` to clone a boilerplate from any giget ref instead:

```sh
b10cks init my-app --template gh:b10cks/nuxt-boilerplate
b10cks init my-app --template gh:me/my-fork#branch
b10cks init my-app --template gitlab:me/template
b10cks init my-app --template https://example.com/template.tar.gz
```

Refs resolve through giget, so GitHub, GitLab, Bitbucket, Sourcehut and plain
tarball URLs all work. A bare name (`--template nuxt-starter`) resolves against
giget's template registry. Local directories are not supported.

### Tokens

`init` resolves an access token in this order:

1. `--token`, if given.
2. A token minted through the Management API, when you are logged in — it prompts
   for a space (or uses `--space`) and creates one named after the project.
3. Otherwise it prompts you to paste an existing token.

If `.env` already defines the token variable, `init` reuses it and mints nothing.
`--dry-run` never mints a token either, since that is a real server-side change.

### Environment variables it writes

The variable name follows each framework's own convention, so it depends on the
build tool rather than the UI library. `init` writes `.env` and adds it to
`.gitignore`; an existing assignment is never overwritten.

| Framework          | Variable                                   |
| ------------------ | ------------------------------------------ |
| Nuxt               | `NUXT_PUBLIC_B10CKS_ACCESS_TOKEN`          |
| Next.js            | `NEXT_PUBLIC_B10CKS_TOKEN`, `B10CKS_TOKEN` |
| React / Vue (Vite) | `VITE_B10CKS_TOKEN`                        |
| SvelteKit          | `PUBLIC_B10CKS_TOKEN`                      |
| Svelte (Vite)      | `VITE_B10CKS_TOKEN`                        |

These are all browser-visible by design — the env var keeps the token out of the
repository, it does not make it secret.

### Existing files

`init` is safe to re-run. It edits configs in place, but when a file is already
wired, or its shape is not recognized, it leaves the file alone and prints the
snippet to add by hand rather than risk mangling it. Svelte's entry is always
reported this way, since inserting into an existing component `<script>` block is
not reliable enough to automate.

## Commands

All commands are namespaced. Run `b10cks <namespace> --help` for subcommands and
options:

```sh
b10cks spaces list
b10cks blocks list <spaceId>
b10cks generate types <spaceId> --out ./src/b10cks/types
```

| Namespace       | Description                          |
| --------------- | ------------------------------------ |
| `ai`            | AI utilities                         |
| `assets`        | manage assets                        |
| `automations`   | manage automations                   |
| `block-folders` | manage block folders                 |
| `block-tags`    | manage block tags                    |
| `blocks`        | manage block definitions             |
| `comments`      | manage content comments              |
| `contents`      | manage content entries               |
| `data-sources`  | manage data sources                  |
| `generate`      | code generation utilities            |
| `provider`      | provider-level management            |
| `redirects`     | manage redirects                     |
| `releases`      | manage releases                      |
| `spaces`        | manage spaces                        |
| `system`        | system information and configuration |
| `teams`         | manage teams                         |
| `tokens`        | manage space access tokens           |
| `users`         | manage user account                  |

### `generate types`

Generate TypeScript definitions from the block schemas in a space.

```sh
b10cks generate types <spaceId>
b10cks generate types <spaceId> --out ./src/b10cks/types
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
  commands/   # One class per namespace, all extend BaseCommand
  init/       # Framework registry, config wiring, .env handling for `init`
  services/   # BaseService wraps ManagementClient; TypeGeneratorService handles codegen
  utils/      # credentials.ts (netrc), refreshTokenIfNeeded.ts (auth guard),
              # project.ts (framework/package-manager detection), exec.ts
```

`BaseCommand` exposes a lazily constructed `ManagementClient` initialized from the
stored token. New commands follow the pattern: create a `*.ts` in `commands/`
exporting a class that extends `BaseCommand`, export it from `commands/index.ts`,
and register it in `src/index.ts`.
