import fs from 'node:fs'
import path from 'node:path'

import { builders, generateCode, loadFile } from 'magicast'
import { addNuxtModule } from 'magicast/helpers'

import type { Framework } from '../utils/project.js'
import { findConfigFile, findFile } from '../utils/project.js'
import { DEFAULT_API_URL, tokenEnv } from './frameworks.js'

export interface WireContext {
  dir: string
  framework: Framework
  apiUrl: string
  dryRun: boolean
  /** Resolved by the caller, which knows what a skipped dry-run scaffold would produce. */
  svelteKit: boolean
  typescript: boolean
}

export interface ManualStep {
  file: string
  snippet: string
}

export interface Changes {
  edited: string[]
  created: string[]
  skipped: string[]
  manual: ManualStep[]
}

export function emptyChanges(): Changes {
  return { edited: [], created: [], skipped: [], manual: [] }
}

/** Keeps magicast's output in the style the framework templates ship with. */
const GENERATE_OPTIONS = { format: { quote: 'single', objectCurlySpacing: true } } as const

function rel(ctx: WireContext, file: string): string {
  return path.relative(ctx.dir, file) || path.basename(file)
}

function write(
  ctx: WireContext,
  file: string,
  content: string,
  changes: Changes,
  kind: 'edited' | 'created'
): void {
  if (!ctx.dryRun) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`)
  }
  changes[kind].push(rel(ctx, file))
}

/**
 * Inserts an import after the last existing one, or at the top of the file.
 * Multi-line imports are followed to the line carrying their `from` clause, so
 * the statement never lands inside a specifier list.
 */
function addImport(source: string, statement: string): string {
  const lines = source.split('\n')
  let insertAt = 0

  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*import\s/.test(lines[i])) continue

    let end = i
    // Side-effect imports (`import './style.css'`) end on their own line;
    // every other form ends on the line holding `from '…'`.
    if (!/^\s*import\s+['"]/.test(lines[i])) {
      while (end < lines.length - 1 && !/\bfrom\s*['"]/.test(lines[end])) end++
    }
    insertAt = end + 1
    i = end
  }

  lines.splice(insertAt, 0, statement)
  return lines.join('\n')
}

function clientOptions(ctx: WireContext, indent: string): string {
  const { expression } = tokenEnv(ctx.framework, ctx.svelteKit)
  return [
    '{',
    `${indent}  apiClientOptions: {`,
    `${indent}    token: ${expression},`,
    `${indent}    baseUrl: '${ctx.apiUrl}',`,
    `${indent}  },`,
    `${indent}}`,
  ].join('\n')
}

/** Body of a provider component that forwards `children` to `component`. */
function jsxProviderBody(ctx: WireContext, component: string): string[] {
  const { expression } = tokenEnv(ctx.framework, ctx.svelteKit)
  return [
    '  return (',
    `    <${component}`,
    '      apiClientOptions={{',
    `        token: ${expression},`,
    `        baseUrl: '${ctx.apiUrl}',`,
    '      }}',
    '    >',
    '      {children}',
    `    </${component}>`,
    '  )',
  ]
}

// ─── Nuxt ─────────────────────────────────────────────────────────────────────

function nuxtSnippet(ctx: WireContext): string {
  const apiUrl = ctx.apiUrl === DEFAULT_API_URL ? '' : `\n    apiUrl: '${ctx.apiUrl}',`
  return [
    'export default defineNuxtConfig({',
    "  modules: ['@b10cks/nuxt'],",
    '  b10cks: {',
    "    componentsDir: '~/b10cks'," + apiUrl,
    '  },',
    '})',
  ].join('\n')
}

async function wireNuxt(ctx: WireContext, changes: Changes): Promise<void> {
  const configPath = findConfigFile(ctx.dir, 'nuxt.config')
  if (!configPath) {
    changes.manual.push({ file: 'nuxt.config.ts', snippet: nuxtSnippet(ctx) })
    return
  }
  if (fs.readFileSync(configPath, 'utf8').includes('@b10cks/nuxt')) {
    changes.skipped.push(rel(ctx, configPath))
    return
  }
  try {
    const mod = await loadFile(configPath)
    // The access token stays out of the config: Nuxt maps
    // NUXT_PUBLIC_B10CKS_ACCESS_TOKEN onto runtimeConfig at runtime.
    const options: Record<string, unknown> = { componentsDir: '~/b10cks' }
    if (ctx.apiUrl !== DEFAULT_API_URL) options.apiUrl = ctx.apiUrl
    addNuxtModule(mod, '@b10cks/nuxt', 'b10cks', options)
    write(ctx, configPath, generateCode(mod, GENERATE_OPTIONS).code, changes, 'edited')
  } catch {
    changes.manual.push({ file: rel(ctx, configPath), snippet: nuxtSnippet(ctx) })
  }
}

// ─── Next ─────────────────────────────────────────────────────────────────────

function nextProviderSource(ctx: WireContext, ts: boolean): string {
  return [
    "'use client'",
    '',
    "import { B10cksNextProvider } from '@b10cks/next/client'",
    ...(ts ? ["import type { ReactNode } from 'react'"] : []),
    '',
    ts
      ? 'export function B10cksProvider({ children }: { children: ReactNode }) {'
      : 'export function B10cksProvider({ children }) {',
    ...jsxProviderBody(ctx, 'B10cksNextProvider'),
    '}',
    '',
  ].join('\n')
}

function nextConfigSnippet(commonjs: boolean): string {
  return commonjs
    ? [
        "const { withB10cks } = require('@b10cks/next')",
        '',
        'module.exports = withB10cks({',
        '  // your existing config',
        '})',
      ].join('\n')
    : [
        "import { withB10cks } from '@b10cks/next'",
        '',
        'export default withB10cks({',
        '  // your existing config',
        '})',
      ].join('\n')
}

async function wireNext(ctx: WireContext, changes: Changes): Promise<void> {
  const configPath = findConfigFile(ctx.dir, 'next.config')
  const source = configPath ? fs.readFileSync(configPath, 'utf8') : ''
  const commonjs = /module\.exports/.test(source)

  if (!configPath) {
    changes.manual.push({ file: 'next.config.ts', snippet: nextConfigSnippet(false) })
  } else if (source.includes('withB10cks')) {
    changes.skipped.push(rel(ctx, configPath))
  } else if (commonjs) {
    // magicast surfaces no default export for `module.exports = …`, so editing
    // would graft ESM onto a CJS file rather than fail — bail out explicitly.
    changes.manual.push({ file: rel(ctx, configPath), snippet: nextConfigSnippet(true) })
  } else {
    try {
      const mod = await loadFile(configPath)
      const current = mod.exports.default
      if (current === undefined) throw new Error('no default export to wrap')
      mod.imports.$add({ from: '@b10cks/next', imported: 'withB10cks' })
      mod.exports.default = builders.functionCall('withB10cks', current)
      write(ctx, configPath, generateCode(mod, GENERATE_OPTIONS).code, changes, 'edited')
    } catch {
      changes.manual.push({ file: rel(ctx, configPath), snippet: nextConfigSnippet(false) })
    }
  }

  const ts = ctx.typescript
  const appDir = ['src/app', 'app'].find((candidate) =>
    fs.existsSync(path.join(ctx.dir, candidate))
  )
  const providerDir = appDir ?? (fs.existsSync(path.join(ctx.dir, 'src')) ? 'src' : '.')
  const providerPath = path.join(ctx.dir, providerDir, `b10cks-provider.${ts ? 'tsx' : 'jsx'}`)

  if (fs.existsSync(providerPath)) {
    changes.skipped.push(rel(ctx, providerPath))
  } else {
    write(ctx, providerPath, nextProviderSource(ctx, ts), changes, 'created')
  }

  // No app/ directory means the pages router, where the wrapper goes in _app.
  if (!appDir) {
    const pagesApp = findFile(ctx.dir, ['src/pages/_app.tsx', 'pages/_app.tsx'])
    return void changes.manual.push({
      file: pagesApp ? rel(ctx, pagesApp) : 'pages/_app.tsx',
      snippet: [
        "import { B10cksProvider } from './b10cks-provider'",
        '',
        '// wrap the page:',
        '<B10cksProvider>',
        '  <Component {...pageProps} />',
        '</B10cksProvider>',
      ].join('\n'),
    })
  }

  const layout = findFile(ctx.dir, [`${appDir}/layout.tsx`, `${appDir}/layout.jsx`])
  if (!layout || !fs.readFileSync(layout, 'utf8').includes('B10cksProvider')) {
    changes.manual.push({
      file: layout ? rel(ctx, layout) : `${appDir}/layout.tsx`,
      snippet: [
        "import { B10cksProvider } from './b10cks-provider'",
        '',
        '// wrap the body children:',
        '<B10cksProvider>{children}</B10cksProvider>',
      ].join('\n'),
    })
  }
}

// ─── React ────────────────────────────────────────────────────────────────────

function reactProviderSource(ctx: WireContext, ts: boolean): string {
  return [
    "import { B10cksProvider as Provider } from '@b10cks/react'",
    ...(ts ? ["import type { ReactNode } from 'react'"] : []),
    '',
    ts
      ? 'export function B10cksProvider({ children }: { children: ReactNode }) {'
      : 'export function B10cksProvider({ children }) {',
    ...jsxProviderBody(ctx, 'Provider'),
    '}',
    '',
  ].join('\n')
}

async function wireReact(ctx: WireContext, changes: Changes): Promise<void> {
  const ts = ctx.typescript
  const providerPath = path.join(ctx.dir, 'src', `b10cks-provider.${ts ? 'tsx' : 'jsx'}`)

  if (fs.existsSync(providerPath)) {
    changes.skipped.push(rel(ctx, providerPath))
  } else {
    write(ctx, providerPath, reactProviderSource(ctx, ts), changes, 'created')
  }

  const entry = findFile(ctx.dir, [
    'src/main.tsx',
    'src/main.jsx',
    'src/index.tsx',
    'src/index.jsx',
  ])
  const manual: ManualStep = {
    file: entry ? rel(ctx, entry) : 'src/main.tsx',
    snippet: [
      "import { B10cksProvider } from './b10cks-provider'",
      '',
      '// wrap your app:',
      '<B10cksProvider>',
      '  <App />',
      '</B10cksProvider>',
    ].join('\n'),
  }

  if (!entry) return void changes.manual.push(manual)

  const source = fs.readFileSync(entry, 'utf8')
  if (source.includes('b10cks-provider')) return void changes.skipped.push(rel(ctx, entry))

  // Only rewrite the unambiguous `<App />` shape the official templates ship.
  const matches = source.match(/<App\s*\/>/g)
  if (matches?.length !== 1) return void changes.manual.push(manual)

  const wrapped = addImport(
    source.replace(/<App\s*\/>/, '<B10cksProvider>\n      <App />\n    </B10cksProvider>'),
    "import { B10cksProvider } from './b10cks-provider'"
  )
  write(ctx, entry, wrapped, changes, 'edited')
}

// ─── Vue ──────────────────────────────────────────────────────────────────────

async function wireVue(ctx: WireContext, changes: Changes): Promise<void> {
  const entry = findFile(ctx.dir, ['src/main.ts', 'src/main.mts', 'src/main.js'])
  const options = clientOptions(ctx, '')
  const manual: ManualStep = {
    file: entry ? rel(ctx, entry) : 'src/main.ts',
    snippet: ["import { B10cksVue } from '@b10cks/vue'", '', `app.use(B10cksVue, ${options})`].join(
      '\n'
    ),
  }

  if (!entry) return void changes.manual.push(manual)

  const source = fs.readFileSync(entry, 'utf8')
  if (source.includes('@b10cks/vue')) return void changes.skipped.push(rel(ctx, entry))

  const useCall = `.use(B10cksVue, ${clientOptions(ctx, '')})`
  let next: string | null = null

  if (/createApp\([^)]*\)\s*\.mount\(/.test(source)) {
    // Chained: createApp(App).mount('#app')
    next = source.replace(/(createApp\([^)]*\))(\s*)\.mount\(/, `$1${useCall}$2.mount(`)
  } else {
    // Variable: const app = createApp(App); … app.mount('#app')
    const mount = source.match(/^([ \t]*)(\w+)\.mount\(/m)
    if (mount) {
      const [line, indent, variable] = mount
      next = source.replace(line, `${indent}${variable}${useCall}\n${line}`)
    }
  }

  if (!next) return void changes.manual.push(manual)
  write(ctx, entry, addImport(next, "import { B10cksVue } from '@b10cks/vue'"), changes, 'edited')
}

// ─── Svelte ───────────────────────────────────────────────────────────────────

async function wireSvelte(ctx: WireContext, changes: Changes): Promise<void> {
  const kit = ctx.svelteKit
  const { importStatement } = tokenEnv('svelte', kit)
  const entry = findFile(ctx.dir, ['src/routes/+layout.svelte', 'src/App.svelte', 'src/app.svelte'])

  if (entry && fs.readFileSync(entry, 'utf8').includes('@b10cks/svelte')) {
    changes.skipped.push(rel(ctx, entry))
    return
  }

  // Svelte's entry is a component, not a config — inserting into an existing
  // <script> block reliably is not worth the risk of mangling it.
  changes.manual.push({
    file: entry ? rel(ctx, entry) : 'src/routes/+layout.svelte',
    snippet: [
      '<script lang="ts">',
      "  import { createB10cksContext } from '@b10cks/svelte'",
      ...(importStatement ? [`  ${importStatement}`] : []),
      '',
      `  createB10cksContext(${clientOptions(ctx, '  ')})`,
      '</script>',
    ].join('\n'),
  })
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const WIRERS: Record<Framework, (ctx: WireContext, changes: Changes) => Promise<void>> = {
  nuxt: wireNuxt,
  next: wireNext,
  react: wireReact,
  vue: wireVue,
  svelte: wireSvelte,
}

export async function wireFramework(ctx: WireContext): Promise<Changes> {
  const changes = emptyChanges()
  await WIRERS[ctx.framework](ctx, changes)
  return changes
}
