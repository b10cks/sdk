# b10cks SDK

[![CI](https://github.com/b10cks/sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/b10cks/sdk/actions/workflows/ci.yml)
[![Release](https://github.com/b10cks/sdk/actions/workflows/release.yml/badge.svg)](https://github.com/b10cks/sdk/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/@b10cks/client?label=%40b10cks%2Fclient)](https://www.npmjs.com/package/@b10cks/client)
[![License](https://img.shields.io/npm/l/@b10cks/client)](./LICENSE)

Official JavaScript/TypeScript SDKs for [b10cks](https://www.b10cks.com) – a modern headless CMS and content management platform.

Fully typed, framework-agnostic at the core, with first-party integrations for Vue, Nuxt, React,
Next.js and Svelte – plus a CLI and an [MCP server](./packages/mcp-server) that let you (and your AI
coding agent) drive the b10cks Management API directly.

## 📦 Packages

| Package                                         | Version                                                                                                       | What it does                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [`@b10cks/client`](./packages/client)           | [![npm](https://img.shields.io/npm/v/@b10cks/client)](https://www.npmjs.com/package/@b10cks/client)           | Framework-agnostic Data API client                 |
| [`@b10cks/richtext`](./packages/richtext)       | [![npm](https://img.shields.io/npm/v/@b10cks/richtext)](https://www.npmjs.com/package/@b10cks/richtext)       | Rich text → HTML renderer                          |
| [`@b10cks/vue`](./packages/vue)                 | [![npm](https://img.shields.io/npm/v/@b10cks/vue)](https://www.npmjs.com/package/@b10cks/vue)                 | Vue 3 plugin, composables and live-edit directives |
| [`@b10cks/nuxt`](./packages/nuxt)               | [![npm](https://img.shields.io/npm/v/@b10cks/nuxt)](https://www.npmjs.com/package/@b10cks/nuxt)               | Nuxt 4 module                                      |
| [`@b10cks/react`](./packages/react)             | [![npm](https://img.shields.io/npm/v/@b10cks/react)](https://www.npmjs.com/package/@b10cks/react)             | React provider and hooks                           |
| [`@b10cks/next`](./packages/next)               | [![npm](https://img.shields.io/npm/v/@b10cks/next)](https://www.npmjs.com/package/@b10cks/next)               | Next.js integration layer                          |
| [`@b10cks/svelte`](./packages/svelte)           | [![npm](https://img.shields.io/npm/v/@b10cks/svelte)](https://www.npmjs.com/package/@b10cks/svelte)           | Svelte context, stores and actions                 |
| [`@b10cks/mcp-server`](./packages/mcp-server)   | [![npm](https://img.shields.io/npm/v/@b10cks/mcp-server)](https://www.npmjs.com/package/@b10cks/mcp-server)   | MCP server for the Management API                  |
| [`@b10cks/cli`](./packages/cli)                 | [![npm](https://img.shields.io/npm/v/@b10cks/cli)](https://www.npmjs.com/package/@b10cks/cli)                 | Scaffolding, schema sync and type generation       |
| [`@b10cks/mgmt-client`](./packages/mgmt-client) | [![npm](https://img.shields.io/npm/v/@b10cks/mgmt-client)](https://www.npmjs.com/package/@b10cks/mgmt-client) | Typed Management API client                        |

### [@b10cks/client](./packages/client)

Framework-agnostic core for the [b10cks](https://www.b10cks.com) Data API.

- Type-safe HTTP client
- Shared `B10cksDataApi` abstraction
- Automatic pagination handling
- Revision and version tracking
- Works in browsers and Node.js

```bash
npm install @b10cks/client
```

### [@b10cks/vue](./packages/vue)

Vue 3 integration for [b10cks](https://www.b10cks.com) content experiences.

- Vue 3 plugin with global directives
- Data composables built on `@b10cks/client`
- Editable content directives (`v-editable`, `v-editable-field`)
- Reusable component system
- Preview bridge support

```bash
npm install @b10cks/vue @b10cks/client
```

### [@b10cks/nuxt](./packages/nuxt)

Nuxt 4 module for [b10cks](https://www.b10cks.com) integration.

- Auto-configured b10cks integration
- Shared composables via `@b10cks/vue`
- Runtime configuration
- Built on top of `@b10cks/vue`

```bash
npm install @b10cks/nuxt
```

### [@b10cks/react](./packages/react)

React integration for [b10cks](https://www.b10cks.com) with hooks and rendering helpers.

- `B10cksProvider` context for client/data API
- Typed hooks (`useB10cksApi`)
- Preview bridge integration

```bash
npm install @b10cks/react @b10cks/client
```

### [@b10cks/svelte](./packages/svelte)

Svelte integration for [b10cks](https://www.b10cks.com) with context, stores, and actions.

- Svelte context setup (`createB10cksContext`)
- Typed async stores (`createB10cksStores`)
- `editable` and `editableField` actions

```bash
npm install @b10cks/svelte @b10cks/client
```

### [@b10cks/next](./packages/next)

Next.js integration layer for [b10cks](https://www.b10cks.com) on top of the React SDK.

- Next-friendly provider (`B10cksNextProvider`)
- Server helper (`createB10cksNextApi`)
- Config helper (`withB10cks`)

```bash
npm install @b10cks/next @b10cks/react @b10cks/client
```

### [@b10cks/richtext](./packages/richtext)

Framework-agnostic rich text rendering for the [b10cks](https://www.b10cks.com) rich text field.

- Renders the editor document tree to HTML
- Escapes text and attributes, sanitizes `href`/`src` URL schemes
- Pluggable resolvers for internal links and custom nodes
- No framework or DOM dependency

```bash
npm install @b10cks/richtext
```

### [@b10cks/mcp-server](./packages/mcp-server)

Model Context Protocol server that exposes the [b10cks](https://www.b10cks.com) Management API to AI
coding agents such as Claude Code, Cursor and Claude Desktop.

- Block definitions, content, redirects, data sources, releases and automations as MCP tools
- Lets an agent read and evolve your content model without hand-written glue
- Built on `@b10cks/mgmt-client`

```bash
npx @b10cks/mcp-server
```

### [@b10cks/cli](./packages/cli)

Command line interface for the [b10cks](https://www.b10cks.com) Management API.

- Project scaffolding and framework wiring (`init`, `kickstart`)
- Schema `pull` / `diff` / `push` with a lockfile
- TypeScript type generation from your block schema
- Credentials stored in `~/.netrc` with `0600` permissions

```bash
npm install -D @b10cks/cli
```

### [@b10cks/mgmt-client](./packages/mgmt-client)

Typed client for the [b10cks](https://www.b10cks.com) Management API.

- Full CRUD across spaces, blocks, content, assets and more
- Shared foundation for `@b10cks/cli` and `@b10cks/mcp-server`
- Server-side only – Management API tokens must never reach the browser

```bash
npm install @b10cks/mgmt-client
```

## 🚀 Quick Start

### For Nuxt Projects

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@b10cks/nuxt'],
  b10cks: {
    accessToken: 'your-access-token',
    apiUrl: 'https://api.b10cks.com/api',
  },
})
```

### For Vue Projects

```typescript
import { createApp } from 'vue'
import { B10cksVue } from '@b10cks/vue'

const app = createApp(App)

app.use(B10cksVue, {
  apiClientOptions: {
    token: 'your-access-token',
    baseUrl: 'https://api.b10cks.com/api',
  },
})

app.mount('#app')
```

### For Direct API Access

```typescript
import { ApiClient } from '@b10cks/client'
import { createB10cksDataApi } from '@b10cks/client'

const client = new ApiClient(
  {
    baseUrl: 'https://api.b10cks.com/api',
    token: 'your-access-token',
    fetchClient: fetch,
  },
  new URL(window.location.href)
)

const dataApi = createB10cksDataApi(client)
const blocks = await dataApi.getBlocks()
```

## 📖 Documentation

- [b10cks Documentation](https://www.b10cks.com/docs)
- Individual package READMEs: [client](./packages/client/README.md) ·
  [richtext](./packages/richtext/README.md) · [vue](./packages/vue/README.md) ·
  [nuxt](./packages/nuxt/README.md) · [react](./packages/react/README.md) ·
  [next](./packages/next/README.md) · [svelte](./packages/svelte/README.md) ·
  [mcp-server](./packages/mcp-server/README.md) · [cli](./packages/cli/README.md) ·
  [mgmt-client](./packages/mgmt-client/README.md)

## 🛠️ Development

### Prerequisites

- Node.js 24.7.0 or higher
- pnpm 11 or higher (pinned via `packageManager`, so pnpm installs the right version for you)

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Lint and fix code
pnpm run lint:fix
```

### Project Structure

```
sdk/
├── packages/
│   ├── client/       # Core API client
│   ├── mgmt-client/  # Management API client
│   ├── cli/          # b10cks CLI
│   ├── mcp-server/   # MCP server
│   ├── richtext/     # Rich text renderer
│   ├── vue/          # Vue 3 plugin
│   ├── react/        # React SDK
│   ├── svelte/       # Svelte SDK
│   ├── nuxt/         # Nuxt module
│   └── next/         # Next.js integration
├── scripts/          # Build and utility scripts
├── .changeset/       # Pending changesets for the next release
└── .github/
    ├── workflows/ci.yml       # Lint, format, build, typecheck, test
    └── workflows/release.yml  # Version PR + npm publish
```

## 🚢 Versioning & Releasing

All packages are versioned and published from CI using
[changesets](https://github.com/changesets/changesets). **Never run `changeset version` or
`pnpm publish` from your machine** – the version bumps, git tags, GitHub releases and npm publishes
are all handled by [`.github/workflows/release.yml`](./.github/workflows/release.yml).

Each package is versioned independently (semver), and internal `workspace:` dependencies are bumped
for you when a dependency changes.

### 1. Describe your change

Every pull request that changes a package needs a changeset:

```bash
pnpm changeset
```

Select the affected packages, choose the bump type, and write a short user-facing summary – it ends
up verbatim in the package's `CHANGELOG.md` and GitHub release notes.

| Bump      | Use it for                                              |
| --------- | ------------------------------------------------------- |
| **patch** | Bug fixes, internal refactors, dependency bumps         |
| **minor** | New features and options that stay backwards-compatible |
| **major** | Breaking API changes                                    |

Commit the generated file in `.changeset/` alongside your code. CI fails a PR that touches a package
without one; if the change genuinely needs no release (docs, CI, tests), add the `skip-changeset`
label to the PR or record an explicit no-op with `pnpm changeset add --empty`.

### 2. Merge into `main`

The release workflow collects all pending changesets and opens (or updates) a **`🔖 Version packages`**
pull request. That PR applies the version bumps, rewrites the changelogs, and deletes the consumed
changeset files. It stays open and keeps updating itself as more changesets land, so it doubles as a
preview of the next release.

### 3. Merge the version PR to ship

Merging it triggers the publish: `pnpm release` builds every package and runs `changeset publish`,
which pushes the git tags and creates one GitHub release per package.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) via OIDC, so no
npm token is involved and every tarball ships with a provenance attestation.

```
your PR (+ changeset) ──▶ main ──▶ "🔖 Version packages" PR ──▶ main ──▶ npm + GitHub releases
```

Repository and npm settings required for this to work are documented in
[CONTRIBUTING.md](./CONTRIBUTING.md#one-time-repository-setup).

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Making code changes
- Writing tests
- Submitting pull requests

## 📋 License

MIT – see [LICENSE](./LICENSE) for details

## 🔐 Security

Please report security vulnerabilities privately – see [SECURITY.md](./SECURITY.md). Do not open a
public issue for them.

## 💬 Support & Community

- **Discussions**: [GitHub Discussions](https://github.com/b10cks/sdk/discussions) – questions, ideas and show & tell
- **Issues**: [GitHub Issues](https://github.com/b10cks/sdk/issues) – bugs and feature requests
- **Discord**: [Join our community](https://discord.gg/mdcDktFFcp)

## 🔗 Links

- [b10cks Website](https://www.b10cks.com)
- [b10cks Documentation](https://www.b10cks.com/docs)
- [GitHub Repository](https://github.com/b10cks/sdk)
- [npm Organization](https://www.npmjs.com/org/b10cks)

---

Made with ❤️ in Austria by [Coder's Cantina](https://www.coderscantina.com)
