# @b10cks/cli

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
