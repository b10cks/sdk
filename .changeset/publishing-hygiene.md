---
"@b10cks/nuxt": patch
"@b10cks/cli": patch
---

Publishing hygiene:

- Exclude embedded source content from published sourcemaps (`sourcemapExcludeSources`) across all packages — keeps line-level maps for debugging without shipping full TypeScript source or bloating the tarball.
- `@b10cks/nuxt`: move `@nuxt/kit` from `devDependencies` to `dependencies` (the built module imports it at runtime, per Nuxt module convention).
- `@b10cks/cli`: move the inlined runtime dependencies (chalk, commander, figlet, inquirer, ora, netrc) to `devDependencies` since `inlineDependencies` already bundles them, avoiding a double install. `update-notifier` stays a runtime dependency because its bundle keeps `ky` external.
- Bump the workspace-resolved `next` to a patched version (≥16.2.6) to clear the high-severity advisories in the lockfile.
