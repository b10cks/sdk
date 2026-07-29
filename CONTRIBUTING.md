# Contributing to b10cks Open Source SDKs

Thank you for your interest in contributing to b10cks Open Source SDKs! We welcome contributions from the community to help improve our SDKs and make them more useful for everyone.

## How to Contribute

1. **Fork the Repository**: Start by forking the repository to your own GitHub account.
2. **Create a Branch**: Create a new branch for your feature or bug fix.
3. **Make Changes**: Make your changes in the new branch. Ensure that your code adheres to the project's coding standards and guidelines.
4. **Write Tests**: If applicable, write tests for your changes to ensure they work as expected.
5. **Commit Your Changes**: Commit your changes with a clear and concise commit message that describes what you have done. We're using gitmoji-style commit messages, so please follow that format.
6. **Create a Pull Request**: Go to the original repository and create a pull request (PR) from your branch. Provide a clear description of the changes you made and why they are necessary.
7. **Review and Address Feedback**: Be open to feedback from the maintainers. You may need to make additional changes based on their suggestions.

## Development Setup

### Pre-requisites

- Ensure you have [Node.js](https://nodejs.org/) installed (version 24.7 or higher).
- Install [pnpm](https://pnpm.io/) as the package manager. The exact version is pinned via the
  `packageManager` field, so pnpm installs it for you.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/b10cks/sdk.git
   ```
2. Inside the project directory, run to install the required dependencies:
   ```bash
   pnpm install
   ```

## Continuous Integration

Every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Job               | What it does                                                  |
| ----------------- | ------------------------------------------------------------- |
| Lint & format     | `oxlint --deny-warnings` and `oxfmt --check`                  |
| Build & test      | `pnpm build`, `pnpm typecheck`, `pnpm test` on Node 24 and 26 |
| Changeset present | Fails if you changed a package without adding a changeset     |

Run the same checks locally with `pnpm lint`, `pnpm format`, `pnpm build`, `pnpm typecheck` and
`pnpm test`.

## Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets) and
[`.github/workflows/release.yml`](.github/workflows/release.yml). Nothing is versioned or published
from a developer machine.

1. **Add a changeset** to your PR describing the user-facing change:
   ```bash
   pnpm changeset
   ```
   Pick the affected packages and the bump type (patch/minor/major), then commit the generated file
   in `.changeset/`. Changes that need no release (docs, CI, tests) can skip this by adding the
   `skip-changeset` label to the PR.
2. **Merge the PR** into `main`. The release workflow collects all pending changesets and opens (or
   updates) a `🔖 Version packages` pull request that applies the version bumps and changelog entries.
3. **Merge the version PR** when you want to ship. The workflow then runs `pnpm release`
   (build + `changeset publish`), pushes the git tags and creates a GitHub release per package.

### One-time repository setup

- **Settings → Actions → General → Workflow permissions**: enable
  _Allow GitHub Actions to create and approve pull requests_, otherwise the version PR cannot be
  opened.
- **npm trusted publishing**: for each published package, add a trusted publisher on npmjs.com
  (_Settings → Trusted publishers_) pointing at repository `b10cks/sdk` and workflow
  `.github/workflows/release.yml`. This replaces long-lived npm tokens and gives the published
  tarballs provenance attestations. Packages: `@b10cks/client`, `@b10cks/mgmt-client`,
  `@b10cks/mcp-server`, `@b10cks/cli`, `@b10cks/richtext`, `@b10cks/vue`, `@b10cks/react`,
  `@b10cks/svelte`, `@b10cks/nuxt`, `@b10cks/next`.
- Trusted publishing requires pnpm 11 or newer, which is why the `packageManager` field is pinned to
  a pnpm 11 release. If a package has no trusted publisher configured yet, an `NPM_TOKEN` secret is
  used as a fallback.

## Questions and Support?

If you have any questions or need support, feel free to reach out to the maintainers. We are here to help!

1. You can check the [b10cks documentation](https://www.b10cks.com/docs).
2. Open an issue in this repository if you encounter any problems or have questions about the SDKs.
3. Join our [Discord community](https://discord.gg/coders_cantina) for community support.
