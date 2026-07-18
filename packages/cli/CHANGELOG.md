# @b10cks/cli

## 1.6.0

### Minor Changes

- Add local block schema as source of truth: `b10cks schema pull|diff|push` sync a `b10cks/schema/*.block.json` directory against a space (three-way diff via `b10cks/schema.lock.json`, upsert keyed by external_id, `--prune`, `--dry-run`, `--force`), backed by the new `blocks.sync()` bulk endpoint in the management client and a TypeScript port of the CMS schema normalization pipeline. `b10cks generate types` now generates from the local schema directory when the space ID is omitted.

### Patch Changes

- Updated dependencies []:
  - @b10cks/mgmt-client@1.4.0

## 1.5.0

### Minor Changes

- Bring the management client and MCP server up to date with the current management API.

  **mgmt-client**

  - Add DAM resources: `assetCollections`, `assetShares`, `assetPackages`, and public `shares` (including binary image-preview support and share-access-token auth).
  - Add asset versions and `replaceFile`, user notifications, space usage/history/invoices, onboarding, contents & icons import/export, `authorization`, space blueprints catalogue, and public invite lookup.
  - Fix endpoints that no longer existed on the server: `ai.translate`, `ai.generateMetaTags`, and `dataSources.translateMissingDimensions` now target their `/stream` routes.
  - Type space and content settings: new `SpaceSettings` and `ContentSettings` interfaces (with `site_locales`, `content_sorting`, `onboarding_dismissed_at`, `sitemap`, `cache_ttl`, `cache_tags`, `child_sort_by`/`child_sort_direction`, …) replace the untyped `settings` records.
  - Correct the `Content` response type to match `ContentResource` (it previously declared `data`/`metadata`/`space_id`, which the API never returned); add the `badge`, `plan`, `user_count`, and `content_updated_at` fields to `Space`.
  - Remove `spaces.listSpaceRoles` (it called a route that returned 404; use `teams.listSpaceRoles`) and the space/content presence methods (realtime collaboration, not a management concern).

  **mcp-server**

  - Add operations covering the new client surface plus previously unmapped methods (teams, users, notifications, usage, DAM, public shares, authorization, blueprints).

  **cli**

  - Remove the broken `spaces roles list` command (roles are team-scoped).
  - Fix `spaces`/`teams` member list commands so `--page`/`--per-page` are actually sent.

### Patch Changes

- Updated dependencies []:
  - @b10cks/mgmt-client@1.3.0

## 1.4.0

### Minor Changes

- Add `b10cks init` to set up a b10cks integration or scaffold a new project.

  `init` detects the framework in the target directory (Nuxt, Next.js, React, Vue, or Svelte) and wires it up: it installs the required packages, edits the framework config, writes the access token to `.env`, and gitignores it. When the directory is empty — or holds nothing but a `.git`, so `git init` then `b10cks init .` works — it first scaffolds a project, delegating to the framework's own official scaffolder or cloning any [giget](https://github.com/unjs/giget) ref passed via `--template`.

  ```sh
  b10cks init                                            # integrate into this project
  b10cks init my-app --framework nuxt                    # scaffold, then integrate
  b10cks init my-app --template gh:b10cks/nuxt-boilerplate
  b10cks init --dry-run                                  # preview, write nothing
  ```

  The token is minted through the Management API when you are logged in, and prompted for otherwise. It is written to `.env` before dependencies are installed, so a failed install never strands a token that is only shown once. Re-running is safe: an existing assignment anywhere in the dotenv cascade (`.env`, `.env.local`, …) is reused rather than re-minted, and already-wired files are left untouched.

  Configs whose shape is not recognized are reported with a snippet to apply by hand rather than rewritten — including CommonJS `next.config.js`, which gets a `require()`-based snippet instead of an ESM edit.

  Env var names follow each framework's own convention (`NUXT_PUBLIC_B10CKS_ACCESS_TOKEN`, `NEXT_PUBLIC_B10CKS_TOKEN`, `VITE_B10CKS_TOKEN`, `PUBLIC_B10CKS_TOKEN`). The framework READMEs previously showed the access token hardcoded in source; they now document the matching env var instead. The CLI README has also been brought back in line with the actual command surface, which has been namespaced (`b10cks spaces list`) rather than hyphenated (`b10cks spaces-list`) for some time.

### Patch Changes

- Fix every command crashing with `ENOENT: no such file or directory, open '.../fonts/small.flf'`.

  The help banner was rendered at startup with figlet, which loads its fonts from disk at runtime. The published package ships only `dist/**`, and bundling inlines figlet's code but not its `.flf` data — so the font was never present and the CLI threw before it could parse argv. That made the published package unusable for every command, including `npx @b10cks/cli --version`.

  The banner is a constant, so it is now a literal string and figlet is no longer a dependency. Output is unchanged.

## 1.3.0

### Minor Changes

- Type asset metadata across clients and generated types

  - `@b10cks/client`: new exported content-model types `B10cksAssetMetadata`, `B10cksAssetValue`, `B10cksAssetA11y`, `B10cksAssetThumbnail`, `B10cksAssetExif` and `B10cksAssetMediaTags` describing the asset `metadata` shape delivered in content payloads, including the new `dominant_color`, `palette`, `animated` and `a11y` (WCAG scheme/luminance/contrast) fields.
  - `@b10cks/mgmt-client`: `Asset.metadata` is now typed as `AssetMetadata | null` (with `AssetA11y`, `AssetThumbnail`, `AssetExif`, `AssetMediaTags` companions) instead of `Record<string, unknown> | null`.
  - `@b10cks/cli`: `b10cks generate types` now emits the full `B10cksAssetMetadata` shape (image, video, audio and document fields plus color/a11y data) instead of the previous minimal inline `metadata` object; `width`/`height` are now correctly optional for non-image assets.

### Patch Changes

- Updated dependencies []:
  - @b10cks/mgmt-client@1.2.0

## 1.2.1

### Patch Changes

- b87c0b8: Safer `~/.netrc` handling: refuse to rewrite the file when an existing one cannot be parsed (previously this silently wiped all other hosts' credentials), write it with `0600` permissions so the stored token is not world-readable, and fall back to `os.homedir()` when `HOME`/`USERPROFILE` is unset. `b10cks login` now also distinguishes invalid-token errors from network/server failures.
- 6b49062: Read `B10CKS_API_DOMAIN` at runtime instead of baking it in at build time, so self-hosted/staging instances can be targeted via the env var as documented. Also fix the mangled settings URL printed by `b10cks login` (`https:/.b10cks.com` → `https://b10cks.com`) by deriving the account URL with proper URL parsing.
- 76d661e: Publishing hygiene:

  - Exclude embedded source content from published sourcemaps (`sourcemapExcludeSources`) across all packages — keeps line-level maps for debugging without shipping full TypeScript source or bloating the tarball.
  - `@b10cks/nuxt`: move `@nuxt/kit` from `devDependencies` to `dependencies` (the built module imports it at runtime, per Nuxt module convention).
  - `@b10cks/cli`: move the inlined runtime dependencies (chalk, commander, figlet, inquirer, ora, netrc) to `devDependencies` since `inlineDependencies` already bundles them, avoiding a double install. `update-notifier` stays a runtime dependency because its bundle keeps `ky` external.
  - Bump the workspace-resolved `next` to a patched version (≥16.2.6) to clear the high-severity advisories in the lockfile.

- Updated dependencies [12f184b]
- Updated dependencies [b20fd24]
- Updated dependencies [e28024e]
- Updated dependencies [2253eea]
  - @b10cks/mgmt-client@1.1.0
