# @b10cks/next

## 0.4.2

### Patch Changes

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

- Updated dependencies []:
  - @b10cks/react@0.5.3

## 0.4.1

### Patch Changes

- Updated dependencies []:
  - @b10cks/richtext@0.6.0
  - @b10cks/react@0.5.2

## 0.4.0

### Minor Changes

- 6e0a1d4: Prevent SSR request-state bleed in the Next server helper. `createB10cksNextApi` is now documented as request-scoped (its client holds the content revision and per-instance caches, so a module-level singleton would leak a preview/draft revision to other visitors). A new `defineB10cksNextApi(optionsFactory)` wraps creation in React's `cache()`, giving each App Router request its own client while safely being exported at module scope. Request-scoped `getRv`/`setRv` remain available via the options.

### Patch Changes

- 12f184b: Fix broken CJS entry points: the CommonJS bundle was emitted as `index.js` inside `"type": "module"` packages, so `require()` resolved it as ESM and returned an empty module. CJS bundles are now emitted as `.cjs` and `main`/`exports.require` updated accordingly. The `svelte` export condition now points at the ESM bundle.
- Updated dependencies [12f184b]
- Updated dependencies [8f39226]
- Updated dependencies [955ac1f]
- Updated dependencies [bafd700]
- Updated dependencies [59ad33d]
- Updated dependencies [3ada87f]
  - @b10cks/client@1.6.0
  - @b10cks/richtext@0.5.0
  - @b10cks/react@0.5.1

## 0.3.5

### Patch Changes

- Document live preview & visual editing for Next.js: `B10cksNextProvider` forwards the new `scrollOffset`/`allowedOrigins` options, and `@b10cks/next/client` re-exports the `useEditable`/`useEditableField`/`usePreviewContent` hooks from `@b10cks/react`.

- Updated dependencies []:
  - @b10cks/client@1.5.0
  - @b10cks/react@0.5.0
