import fs from 'node:fs'
import path from 'node:path'

export type Framework = 'nuxt' | 'next' | 'react' | 'vue' | 'svelte'
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export const FRAMEWORKS: Framework[] = ['nuxt', 'next', 'react', 'vue', 'svelte']
export const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

export interface PackageJson {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  packageManager?: string
}

export function readPackageJson(dir: string): PackageJson | null {
  const file = path.join(dir, 'package.json')
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as PackageJson
  } catch {
    return null
  }
}

export function dependenciesOf(pkg: PackageJson | null): Record<string, string> {
  return { ...pkg?.dependencies, ...pkg?.devDependencies }
}

const CONFIG_EXTENSIONS = ['ts', 'mts', 'js', 'mjs', 'cjs']

/** Resolves `<base>.<ext>` for the first extension that exists (e.g. `nuxt.config`). */
export function findConfigFile(dir: string, base: string): string | null {
  for (const ext of CONFIG_EXTENSIONS) {
    const file = path.join(dir, `${base}.${ext}`)
    if (fs.existsSync(file)) return file
  }
  return null
}

/** Resolves the first of `candidates` that exists, relative to `dir`. */
export function findFile(dir: string, candidates: string[]): string | null {
  for (const candidate of candidates) {
    const file = path.join(dir, candidate)
    if (fs.existsSync(file)) return file
  }
  return null
}

export function detectFramework(dir: string): Framework | null {
  const deps = dependenciesOf(readPackageJson(dir))
  const has = (name: string) => Boolean(deps[name])

  // Order matters: meta-frameworks must win over the UI library they build on.
  if (has('nuxt') || findConfigFile(dir, 'nuxt.config')) return 'nuxt'
  if (has('next') || findConfigFile(dir, 'next.config')) return 'next'
  if (has('svelte') || has('@sveltejs/kit') || findConfigFile(dir, 'svelte.config')) return 'svelte'
  if (has('vue')) return 'vue'
  if (has('react')) return 'react'
  return null
}

export function isSvelteKit(dir: string): boolean {
  return Boolean(dependenciesOf(readPackageJson(dir))['@sveltejs/kit'])
}

const LOCKFILES: ReadonlyArray<readonly [string, PackageManager]> = [
  ['bun.lock', 'bun'],
  ['bun.lockb', 'bun'],
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
]

export function detectPackageManager(dir: string): PackageManager {
  const field = readPackageJson(dir)?.packageManager?.split('@')[0]
  if (field && (PACKAGE_MANAGERS as string[]).includes(field)) return field as PackageManager

  for (const [file, pm] of LOCKFILES) {
    if (fs.existsSync(path.join(dir, file))) return pm
  }
  return 'npm'
}

/**
 * True when `dir` is absent, empty, or holds nothing but `.git` — the same rule
 * create-vite applies, so `git init` followed by `b10cks init .` works. Anything
 * looser would pass files the official scaffolders then refuse to overwrite.
 */
export function isEmptyDir(dir: string): boolean {
  if (!fs.existsSync(dir)) return true
  const entries = fs.readdirSync(dir)
  return entries.length === 0 || (entries.length === 1 && entries[0] === '.git')
}

export function isTypeScript(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'tsconfig.json'))
}

export function installArgs(pm: PackageManager, packages: string[]): [string, string[]] {
  return pm === 'npm' ? ['npm', ['install', ...packages]] : [pm, ['add', ...packages]]
}
