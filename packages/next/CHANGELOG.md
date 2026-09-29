# @b10cks/next

## 1.0.0

### Major Changes

- [#23](https://github.com/b10cks/sdk/pull/23) [`bc84cef`](https://github.com/b10cks/sdk/commit/bc84cef47c9bae996ddd296414458bc302a73782) Thanks [@badmike](https://github.com/badmike)! - **Breaking:** `@b10cks/richtext` now depends on Tiptap (`@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-table`), and `@b10cks/client` on `@b10cks/richtext`, so installing any of these packages installs Tiptap. No bundle includes it unless the in-place editor loads. In-place editing needs an editor on bridge protocol 3; the preview now applies its own edits to its content store, and editors on protocol 3 no longer echo them back.
  
  Edit rich text in place in the visual editor. `B10cksRichText` in Vue, React, and Svelte takes an `editable` prop with the block id and field path, e.g. `{ id: block.id, path: ['body'] }`. A click turns the rendered text into an editor with the CMS editor's schema and the field's formatting options; edits stream to the CMS form live, changes made there merge in without moving the cursor, and Escape returns to block selection. For custom renderers, `attachRichTextField` from `@b10cks/client` does the same for any element.
  
  The editor lives in a new entry, `@b10cks/richtext/editor`, built on Tiptap. It is only ever loaded with a dynamic `import()` after a hover or click in preview mode, so production bundles, SSR, and the preview before editing still use the lightweight renderer. `@b10cks/richtext` now depends on `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-table` for that entry, and `@b10cks/client` on `@b10cks/richtext`.
  
  The bridge protocol is now version 3: the editor answers FIELD_SELECT of a rich text field with FIELD_CONFIG when the user may edit it. Older editors and read-only users keep the select-only behavior. `previewBridge.patchLocal` applies an edit made in the preview to the preview's own content store.
  
  In React, `B10cksRichText` stays hook-free without `editable`, so it still renders in Server Components.

### Patch Changes

- Updated dependencies [[`bc84cef`](https://github.com/b10cks/sdk/commit/bc84cef47c9bae996ddd296414458bc302a73782)]:
  - @b10cks/richtext@1.0.0
  - @b10cks/client@2.0.0
  - @b10cks/react@1.0.0

## 0.5.1

### Patch Changes

- Updated dependencies [[`8a48979`](https://github.com/b10cks/sdk/commit/8a48979204d0d2816edb4d9f07138ec7a1cb35b9), [`db643f7`](https://github.com/b10cks/sdk/commit/db643f7fa3f25057741c611f9604af6e586ba220), [`b8b43e3`](https://github.com/b10cks/sdk/commit/b8b43e3a9774edac86f2b79f4151b6cd1992d894), [`b8b43e3`](https://github.com/b10cks/sdk/commit/b8b43e3a9774edac86f2b79f4151b6cd1992d894), [`8a48979`](https://github.com/b10cks/sdk/commit/8a48979204d0d2816edb4d9f07138ec7a1cb35b9)]:
  - @b10cks/react@0.9.0
  - @b10cks/client@1.12.0

## 0.5.0

### Minor Changes

- Link to blocks on a page

  Internal links can carry an `anchor`: the id of a block on the target page.

  - `resolveB10cksLink` appends `params` as a query string and `anchor` as a fragment, `/about?ref=nav#01kh…`. `url` links get their `params` too. The anchor is URI-encoded and skipped when the href already has a `#`. `B10cksLink` `params` is now typed `Record<string, string> | string`, matching what the CMS stores.
  - New `blockAnchorAttrs(block)` returns `{ id: block.id }`, or `{}` without an id. Exported from client, vue, react, svelte and next, and auto-imported by nuxt along with `resolveB10cksLink`.
  - Rich text `internalLink` marks append the anchor to the `url` or the `internalLinkHandler` result, unless it already contains `#`. Unresolved links stay `href="#"`.
  - `v-editable` renders `id="<block.id>"` on its element, in production and during SSR. An `id` on the element wins; opt out with `v-editable.noanchor`.
  - React `B10cksComponent` renders `id={block.id}` on its wrapper. An `id` prop wins; opt out with `anchor={false}`.

  Block ids are ULIDs and can start with a digit, so look them up with `getElementById` or escape them with `CSS.escape` for `querySelector`.

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.11.0
  - @b10cks/richtext@0.8.0
  - @b10cks/react@0.8.0

## 0.4.6

### Patch Changes

- Updated dependencies [[`161b103`](https://github.com/b10cks/sdk/commit/161b1031f11a4329b2a903ec3ee9d3c1f0c78efb), [`0a032af`](https://github.com/b10cks/sdk/commit/0a032afd66cec876271ff53b706e5c7912f2e14d)]:
  - @b10cks/client@1.10.0
  - @b10cks/richtext@0.7.0
  - @b10cks/react@0.7.1

## 0.4.5

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.9.0
  - @b10cks/react@0.7.0

## 0.4.4

### Patch Changes

- Updated dependencies []:
  - @b10cks/client@1.8.0
  - @b10cks/react@0.6.0

## 0.4.3

### Patch Changes

- 4040149: Normalise package metadata across the workspace.

  - Add the missing `LICENSE` file to `cli`, `mcp-server`, `next`, `react`,
    `richtext` and `svelte`. `mcp-server` listed `LICENSE` in its `files` array
    but shipped without one.
  - Add `keywords`, `homepage` and `bugs` to every package; previously only
    `mcp-server` had them, so the rest were undiscoverable on npm.
  - Use the structured `author` object everywhere instead of a free-text string.
  - Declare `publishConfig.access` and `engines` consistently. `cli` now requires
    Node `>=20` (was `>=18`, which is past end-of-life) to match the others.

- Updated dependencies [4040149]
  - @b10cks/richtext@0.6.1
  - @b10cks/client@1.7.1
  - @b10cks/react@0.5.4

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
