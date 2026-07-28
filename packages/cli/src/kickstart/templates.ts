export const KICKSTART_FRAMEWORKS = ['vue', 'react', 'svelte', 'vanilla'] as const
export type KickstartFramework = (typeof KICKSTART_FRAMEWORKS)[number]

export const KICKSTART_LABELS: Record<KickstartFramework, string> = {
  vue: 'Vue',
  react: 'React',
  svelte: 'Svelte',
  vanilla: 'Vanilla TypeScript',
}

interface TemplateContext {
  /** Human-readable plugin name (page title, sample UI). */
  name: string
  /** npm package name for the scaffolded project. */
  pkgName: string
}

/** Build entry per framework — also what the dev shell imports. */
const ENTRIES: Record<KickstartFramework, string> = {
  vue: 'src/main.ts',
  react: 'src/main.tsx',
  // `.svelte.ts` so the module can use Svelte 5 runes ($state).
  svelte: 'src/main.svelte.ts',
  vanilla: 'src/main.ts',
}

const shellImport: Record<KickstartFramework, string> = {
  vue: '../main',
  react: '../main',
  svelte: '../main.svelte',
  vanilla: '../main',
}

// ---------------------------------------------------------------------------
// Shared files
// ---------------------------------------------------------------------------

const TYPES_TS = `// Types for the b10cks field-plugin contract.
//
// In production the b10cks CMS serves a sandboxed shell document that executes
// your built bundle and calls \`window.b10cksFieldPlugin.mount(el, api)\`.

export type PluginTheme = 'light' | 'dark'

export interface PluginContext {
  spaceId: string
  fieldKey: string
  language?: string
  readOnly: boolean
  isModal: boolean
}

export interface PluginData {
  /** Current field value — opaque JSON, your plugin owns the shape. */
  value: unknown
  /** Options configured on the field in the block schema (string values). */
  options: Record<string, string>
  context: PluginContext
  theme: PluginTheme
}

export interface FieldPluginApi {
  data: PluginData
  /** Push a new field value to the editor. */
  setValue: (value: unknown) => void
  /** Request an explicit iframe height (auto-observed via ResizeObserver too). */
  setHeight: (height: number) => void
  /** Expand the field to a modal overlay (and back). */
  toggleModal: (open: boolean) => void
  /** Reserved for a future host asset picker — rejects with 'unsupported'. */
  selectAsset: () => Promise<unknown>
}

export interface FieldPluginHandlers {
  onValueUpdate?: (value: unknown) => void
  onReadOnlyUpdate?: (readOnly: boolean) => void
  onTheme?: (theme: PluginTheme) => void
}

export interface FieldPlugin {
  mount: (el: HTMLElement, api: FieldPluginApi) => FieldPluginHandlers | void
}

declare global {
  interface Window {
    b10cksFieldPlugin?: FieldPlugin
  }
}
`

function shellTs(framework: KickstartFramework): string {
  return `// Dev-only harness — NOT part of the built bundle.
//
// Two modes:
//  - Embedded by the b10cks editor (dev mode, a token is present in the URL
//    fragment): speaks the real field-plugin postMessage protocol.
//  - Standalone \`vite dev\`: mocks the host with sample data and shows the
//    value the plugin emits.
import '${shellImport[framework]}'

import type { FieldPluginApi, FieldPluginHandlers, PluginData } from '../types'

const PROTOCOL_VERSION = 1

const match = /(?:^|[#&])b10cks-token=([^&]+)/.exec(location.hash)
const token = match ? decodeURIComponent(match[1]) : null
const el = document.getElementById('app') as HTMLElement
const plugin = window.b10cksFieldPlugin

if (!plugin || typeof plugin.mount !== 'function') {
  throw new Error('window.b10cksFieldPlugin is not defined — check your entry module.')
}

let handlers: FieldPluginHandlers = {}

type Send = (type: string, payload?: Record<string, unknown>) => void

function boot(data: PluginData, send: Send): void {
  const api: FieldPluginApi = {
    data,
    setValue: (value) => send('VALUE_CHANGE', { value }),
    setHeight: (height) => send('HEIGHT_CHANGE', { height }),
    toggleModal: (open) => send('MODAL_TOGGLE', { open }),
    selectAsset: () => Promise.reject(new Error('unsupported')),
  }

  handlers = plugin!.mount(el, api) || {}

  const observer = new ResizeObserver(() => {
    send('HEIGHT_CHANGE', { height: document.documentElement.scrollHeight })
  })
  observer.observe(document.documentElement)
  observer.observe(el)
}

if (token && window.parent !== window) {
  // Embedded by the CMS in dev mode.
  const send: Send = (type, payload) => {
    window.parent.postMessage(
      { source: 'b10cks-plugin', version: PROTOCOL_VERSION, token, type, payload: payload ?? {} },
      '*'
    )
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return
    const data = event.data
    if (!data || data.source !== 'b10cks-plugin' || data.token !== token) return
    if (data.version !== PROTOCOL_VERSION) return

    if (data.type === 'INIT') boot(data.payload as PluginData, send)
    else if (data.type === 'VALUE_UPDATE') handlers.onValueUpdate?.(data.payload.value)
    else if (data.type === 'READ_ONLY_UPDATE') handlers.onReadOnlyUpdate?.(data.payload.readOnly)
    else if (data.type === 'THEME') handlers.onTheme?.(data.payload.theme)
  })

  send('PLUGIN_READY')
} else {
  // Standalone dev server — mock host.
  const host = document.getElementById('dev-host')
  const inspector = document.getElementById('dev-value')
  host?.removeAttribute('hidden')

  const send: Send = (type, payload) => {
    console.log('[b10cks]', type, payload)
    if (type === 'VALUE_CHANGE' && inspector) {
      inspector.textContent = JSON.stringify(payload?.value ?? null, null, 2)
    }
  }

  boot(
    {
      value: null,
      options: { example: 'from-schema' },
      context: { spaceId: 'dev', fieldKey: 'dev', readOnly: false, isModal: false },
      theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    },
    send
  )
}
`
}

function indexHtml(ctx: TemplateContext): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${ctx.name} — b10cks field plugin</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; }
      #dev-host {
        position: fixed; bottom: 0; left: 0; right: 0;
        border-top: 1px solid #ddd; background: #fafafa;
        padding: 8px 12px; font-size: 12px; color: #555;
      }
      #dev-host pre { margin: 4px 0 0; white-space: pre-wrap; }
      @media (prefers-color-scheme: dark) {
        body { background: #111; color: #eee; }
        #dev-host { background: #1a1a1a; border-color: #333; color: #aaa; }
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <aside id="dev-host" hidden>
      <strong>Standalone dev host</strong> — emitted value:
      <pre id="dev-value">null</pre>
    </aside>
    <script type="module" src="/src/dev/shell.ts"></script>
  </body>
</html>
`
}

interface PackageJsonParts {
  dependencies?: Record<string, string>
  devDependencies: Record<string, string>
}

function packageJson(ctx: TemplateContext, parts: PackageJsonParts): string {
  return `${JSON.stringify(
    {
      name: ctx.pkgName,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
      },
      ...(parts.dependencies ? { dependencies: parts.dependencies } : {}),
      devDependencies: parts.devDependencies,
    },
    null,
    2
  )}\n`
}

function viteConfig(framework: KickstartFramework): string {
  const plugin = {
    vue: { importLine: "import vue from '@vitejs/plugin-vue'", call: 'vue()' },
    react: { importLine: "import react from '@vitejs/plugin-react'", call: 'react()' },
    svelte: {
      importLine: "import { svelte } from '@sveltejs/vite-plugin-svelte'",
      call: 'svelte()',
    },
    vanilla: null,
  }[framework]

  const imports = [
    "import { defineConfig } from 'vite'",
    ...(plugin ? [plugin.importLine] : []),
    // A field plugin uploads as ONE file: inline component CSS into the bundle.
    ...(framework === 'vanilla'
      ? []
      : ["import cssInjectedByJs from 'vite-plugin-css-injected-by-js'"]),
  ]
  const plugins = [
    ...(plugin ? [plugin.call] : []),
    ...(framework === 'vanilla' ? [] : ['cssInjectedByJs()']),
  ]

  // React resolves its dev/prod build via process.env.NODE_ENV, which Vite
  // does not define in library mode — without this the bundle ships React's
  // development build (~4x larger, console warnings in production).
  const define =
    framework === 'react'
      ? `  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
`
      : ''

  return `${imports.join('\n')}

export default defineConfig({
  plugins: [${plugins.join(', ')}],
${define}  build: {
    // The b10cks CMS executes the bundle as a classic script inside its
    // sandboxed shell, so everything must land in a single IIFE file.
    lib: {
      entry: '${ENTRIES[framework]}',
      formats: ['iife'],
      name: 'B10cksFieldPlugin',
      fileName: () => 'plugin.js',
    },
  },
})
`
}

function tsconfig(framework: KickstartFramework): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        types: ['vite/client'],
        ...(framework === 'react' ? { jsx: 'react-jsx' } : {}),
      },
      include: ['src'],
    },
    null,
    2
  )}\n`
}

function readme(ctx: TemplateContext, framework: KickstartFramework, entry: string): string {
  return `# ${ctx.name}

A [b10cks](https://b10cks.com) field plugin (${KICKSTART_LABELS[framework]}).

## Develop

\`\`\`sh
npm run dev
\`\`\`

Open the printed URL for a standalone preview with a mock host, or set it as
the **Dev URL** of your plugin under *Settings → Field Plugins* (enable
development mode) to develop live inside the content editor.

## Publish

\`\`\`sh
npm run build
\`\`\`

Upload \`dist/plugin.js\` under *Settings → Field Plugins* and hit
**Publish bundle**. Then add a \`plugin\` field to a block and select this
plugin by its handle.

## How it works

The editor loads your plugin in a sandboxed iframe. Your bundle assigns
\`window.b10cksFieldPlugin = { mount(el, api) }\` (see \`${entry}\`):

- \`api.data\` — initial value, schema options, context, theme
- \`api.setValue(value)\` — push a new field value (any JSON shape)
- \`api.setHeight(px)\` / \`api.toggleModal(open)\` — layout controls
- return handlers (\`onValueUpdate\`, \`onReadOnlyUpdate\`, \`onTheme\`) to react
  to host updates

\`src/dev/shell.ts\` and \`index.html\` are development-only; the CMS provides
its own shell in production.
`
}

const GITIGNORE = `node_modules
dist
`

// ---------------------------------------------------------------------------
// Framework entries + starter components
// ---------------------------------------------------------------------------

const VUE_MAIN = `import { createApp, reactive } from 'vue'

import App from './App.vue'
import type { FieldPluginApi } from './types'

window.b10cksFieldPlugin = {
  mount(el: HTMLElement, api: FieldPluginApi) {
    const state = reactive({
      value: api.data.value,
      readOnly: api.data.context.readOnly,
      theme: api.data.theme,
    })

    const app = createApp(App)
    app.provide('b10cks', { api, state })
    app.mount(el)

    return {
      onValueUpdate: (value: unknown) => {
        state.value = value
      },
      onReadOnlyUpdate: (readOnly: boolean) => {
        state.readOnly = readOnly
      },
      onTheme: (theme) => {
        state.theme = theme
      },
    }
  },
}
`

const VUE_APP = `<script setup lang="ts">
import { computed, inject } from 'vue'

import type { FieldPluginApi, PluginTheme } from './types'

const { api, state } = inject('b10cks') as {
  api: FieldPluginApi
  state: { value: unknown; readOnly: boolean; theme: PluginTheme }
}

const text = computed({
  get: () => String(state.value ?? ''),
  set: (next: string) => {
    state.value = next
    api.setValue(next)
  },
})
</script>

<template>
  <div class="field" :data-theme="state.theme">
    <input
      v-model="text"
      class="input"
      :disabled="state.readOnly"
      placeholder="Type something…"
    />
    <p class="hint">Options: {{ api.data.options }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
}
.input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font: inherit;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: #888;
}
.field[data-theme='dark'] .input {
  background: #1a1a1a;
  border-color: #444;
  color: #eee;
}
</style>
`

const REACT_MAIN = `import { createRoot } from 'react-dom/client'

import { App, type AppState } from './App'
import type { FieldPluginApi } from './types'

window.b10cksFieldPlugin = {
  mount(el: HTMLElement, api: FieldPluginApi) {
    const root = createRoot(el)
    const state: AppState = {
      value: api.data.value,
      readOnly: api.data.context.readOnly,
      theme: api.data.theme,
    }

    const render = () => root.render(<App api={api} state={{ ...state }} />)
    render()

    return {
      onValueUpdate: (value: unknown) => {
        state.value = value
        render()
      },
      onReadOnlyUpdate: (readOnly: boolean) => {
        state.readOnly = readOnly
        render()
      },
      onTheme: (theme) => {
        state.theme = theme
        render()
      },
    }
  },
}
`

const REACT_APP = `import { useEffect, useState, type ChangeEvent } from 'react'

import type { FieldPluginApi, PluginTheme } from './types'

import './app.css'

export interface AppState {
  value: unknown
  readOnly: boolean
  theme: PluginTheme
}

export function App({ api, state }: { api: FieldPluginApi; state: AppState }) {
  const [text, setText] = useState(String(state.value ?? ''))

  useEffect(() => {
    setText(String(state.value ?? ''))
  }, [state.value])

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
    api.setValue(event.target.value)
  }

  return (
    <div className="field" data-theme={state.theme}>
      <input
        className="input"
        value={text}
        onChange={onChange}
        disabled={state.readOnly}
        placeholder="Type something…"
      />
      <p className="hint">Options: {JSON.stringify(api.data.options)}</p>
    </div>
  )
}
`

const APP_CSS = `.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
}
.input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font: inherit;
}
.hint {
  margin: 0;
  font-size: 12px;
  color: #888;
}
.field[data-theme='dark'] .input {
  background: #1a1a1a;
  border-color: #444;
  color: #eee;
}
`

const SVELTE_MAIN = `import { mount } from 'svelte'

import App from './App.svelte'
import type { FieldPluginApi, PluginTheme } from './types'

window.b10cksFieldPlugin = {
  mount(el: HTMLElement, api: FieldPluginApi) {
    const state = $state({
      value: api.data.value,
      readOnly: api.data.context.readOnly,
      theme: api.data.theme as PluginTheme,
    })

    mount(App, { target: el, props: { api, state } })

    return {
      onValueUpdate: (value: unknown) => {
        state.value = value
      },
      onReadOnlyUpdate: (readOnly: boolean) => {
        state.readOnly = readOnly
      },
      onTheme: (theme) => {
        state.theme = theme
      },
    }
  },
}
`

const SVELTE_APP = `<script lang="ts">
  import type { FieldPluginApi, PluginTheme } from './types'

  let { api, state }: {
    api: FieldPluginApi
    state: { value: unknown; readOnly: boolean; theme: PluginTheme }
  } = $props()

  function onInput(event: Event) {
    const next = (event.currentTarget as HTMLInputElement).value
    state.value = next
    api.setValue(next)
  }
</script>

<div class="field" data-theme={state.theme}>
  <input
    class="input"
    value={String(state.value ?? '')}
    oninput={onInput}
    disabled={state.readOnly}
    placeholder="Type something…"
  />
  <p class="hint">Options: {JSON.stringify(api.data.options)}</p>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
  }
  .input {
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font: inherit;
  }
  .hint {
    margin: 0;
    font-size: 12px;
    color: #888;
  }
  .field[data-theme='dark'] .input {
    background: #1a1a1a;
    border-color: #444;
    color: #eee;
  }
</style>
`

const SVELTE_CONFIG = `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
}
`

const VANILLA_MAIN = `import type { FieldPluginApi } from './types'

window.b10cksFieldPlugin = {
  mount(el: HTMLElement, api: FieldPluginApi) {
    el.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:8px'

    const input = document.createElement('input')
    input.style.cssText = 'padding:8px 10px;border:1px solid #ccc;border-radius:6px;font:inherit'
    input.placeholder = 'Type something…'
    input.value = String(api.data.value ?? '')
    input.disabled = api.data.context.readOnly
    input.addEventListener('input', () => api.setValue(input.value))

    const hint = document.createElement('p')
    hint.style.cssText = 'margin:0;font-size:12px;color:#888'
    hint.textContent = 'Options: ' + JSON.stringify(api.data.options)

    el.append(input, hint)

    return {
      onValueUpdate: (value: unknown) => {
        input.value = String(value ?? '')
      },
      onReadOnlyUpdate: (readOnly: boolean) => {
        input.disabled = readOnly
      },
    }
  },
}
`

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

const SHARED_DEV_DEPS = {
  typescript: '^5.9.0',
  vite: '^8.0.0',
}

const CSS_INJECT = { 'vite-plugin-css-injected-by-js': '^3.5.0' }

export function templateFiles(
  framework: KickstartFramework,
  ctx: TemplateContext
): Record<string, string> {
  const shared: Record<string, string> = {
    'package.json': packageJson(ctx, PACKAGE_PARTS[framework]),
    'vite.config.ts': viteConfig(framework),
    'tsconfig.json': tsconfig(framework),
    'index.html': indexHtml(ctx),
    'README.md': readme(ctx, framework, ENTRIES[framework]),
    '.gitignore': GITIGNORE,
    'src/types.ts': TYPES_TS,
    'src/dev/shell.ts': shellTs(framework),
  }

  switch (framework) {
    case 'vue':
      return { ...shared, 'src/main.ts': VUE_MAIN, 'src/App.vue': VUE_APP }
    case 'react':
      return {
        ...shared,
        'src/main.tsx': REACT_MAIN,
        'src/App.tsx': REACT_APP,
        'src/app.css': APP_CSS,
      }
    case 'svelte':
      return {
        ...shared,
        'svelte.config.js': SVELTE_CONFIG,
        'src/main.svelte.ts': SVELTE_MAIN,
        'src/App.svelte': SVELTE_APP,
      }
    case 'vanilla':
      return { ...shared, 'src/main.ts': VANILLA_MAIN }
  }
}

const PACKAGE_PARTS: Record<KickstartFramework, PackageJsonParts> = {
  vue: {
    dependencies: { vue: '^3.5.0' },
    devDependencies: {
      '@vitejs/plugin-vue': '^6.0.0',
      ...CSS_INJECT,
      ...SHARED_DEV_DEPS,
      'vue-tsc': '^3.0.0',
    },
  },
  react: {
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: {
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      '@vitejs/plugin-react': '^5.0.0',
      ...CSS_INJECT,
      ...SHARED_DEV_DEPS,
    },
  },
  svelte: {
    devDependencies: {
      '@sveltejs/vite-plugin-svelte': '^6.0.0',
      svelte: '^5.0.0',
      ...CSS_INJECT,
      ...SHARED_DEV_DEPS,
    },
  },
  vanilla: {
    devDependencies: { ...SHARED_DEV_DEPS },
  },
}
