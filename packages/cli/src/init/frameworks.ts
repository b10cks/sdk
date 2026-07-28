import type { Framework, PackageManager } from '../utils/project.js'

export const DEFAULT_API_URL = 'https://api.b10cks.com/api'

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  nuxt: 'Nuxt',
  next: 'Next.js',
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
}

/** Runtime packages each integration needs, in install order. */
export const FRAMEWORK_PACKAGES: Record<Framework, string[]> = {
  nuxt: ['@b10cks/nuxt', '@b10cks/vue', '@b10cks/client', '@b10cks/richtext'],
  next: ['@b10cks/next', '@b10cks/react', '@b10cks/client', '@b10cks/richtext'],
  react: ['@b10cks/react', '@b10cks/client', '@b10cks/richtext'],
  vue: ['@b10cks/vue', '@b10cks/client', '@b10cks/richtext'],
  svelte: ['@b10cks/svelte', '@b10cks/client', '@b10cks/richtext'],
}

export interface TokenEnv {
  /** Env var holding the browser-visible token. */
  publicVar: string
  /** Additional env vars to write (e.g. Next's server-side token). */
  extraVars: string[]
  /**
   * Expression that reads `publicVar` in application code. Empty for Nuxt,
   * which maps `NUXT_PUBLIC_*` onto runtimeConfig without any code reference.
   */
  expression: string
  /** Import needed to make `expression` resolve, if any. */
  importStatement?: string
}

/**
 * Env var names follow each framework's own convention, so they key off the
 * build tool (Vite / Next / SvelteKit) rather than the UI library.
 */
export function tokenEnv(framework: Framework, svelteKit: boolean): TokenEnv {
  switch (framework) {
    case 'nuxt':
      // Nuxt maps NUXT_PUBLIC_B10CKS_ACCESS_TOKEN onto
      // runtimeConfig.public.b10cks.accessToken at runtime — no code reference.
      return { publicVar: 'NUXT_PUBLIC_B10CKS_ACCESS_TOKEN', extraVars: [], expression: '' }
    case 'next':
      return {
        publicVar: 'NEXT_PUBLIC_B10CKS_TOKEN',
        extraVars: ['B10CKS_TOKEN'],
        expression: "process.env.NEXT_PUBLIC_B10CKS_TOKEN ?? ''",
      }
    case 'svelte':
      return svelteKit
        ? {
            publicVar: 'PUBLIC_B10CKS_TOKEN',
            extraVars: [],
            expression: 'PUBLIC_B10CKS_TOKEN',
            importStatement: "import { PUBLIC_B10CKS_TOKEN } from '$env/static/public'",
          }
        : {
            publicVar: 'VITE_B10CKS_TOKEN',
            extraVars: [],
            expression: "import.meta.env.VITE_B10CKS_TOKEN ?? ''",
          }
    default:
      return {
        publicVar: 'VITE_B10CKS_TOKEN',
        extraVars: [],
        expression: "import.meta.env.VITE_B10CKS_TOKEN ?? ''",
      }
  }
}

function createCommand(
  pm: PackageManager,
  pkg: string,
  positional: string[],
  flags: string[] = []
): [string, string[]] {
  // yarn/bun reject the `@latest` tag on `create`; npm needs `--` before flags.
  const spec = pm === 'yarn' || pm === 'bun' ? pkg : `${pkg}@latest`
  const separator = flags.length && pm === 'npm' ? ['--'] : []
  return [pm, ['create', spec, ...positional, ...separator, ...flags]]
}

function dlxCommand(pm: PackageManager, pkg: string, args: string[]): [string, string[]] {
  switch (pm) {
    case 'pnpm':
      return ['pnpm', ['dlx', pkg, ...args]]
    case 'yarn':
      return ['yarn', ['dlx', pkg, ...args]]
    case 'bun':
      return ['bunx', [pkg, ...args]]
    default:
      return ['npx', [pkg, ...args]]
  }
}

/** The framework's own official scaffolder, used when no `--template` is given. */
export function scaffoldCommand(
  framework: Framework,
  pm: PackageManager,
  dirName: string
): [string, string[]] {
  switch (framework) {
    case 'nuxt':
      return createCommand(pm, 'nuxt', [dirName])
    case 'next':
      return createCommand(pm, 'next-app', [dirName], [`--use-${pm}`])
    case 'svelte':
      return dlxCommand(pm, 'sv', ['create', dirName])
    case 'react':
      return createCommand(pm, 'vite', [dirName], ['--template', 'react-ts'])
    case 'vue':
      return createCommand(pm, 'vite', [dirName], ['--template', 'vue-ts'])
  }
}
