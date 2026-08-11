import {
  addComponentsDir,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
  extendViteConfig,
} from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { defu } from 'defu'

import type { ModuleOptions } from './types'

/**
 * Packages that must resolve to a single instance in an app: they carry
 * module-scoped state (injection keys, the preview bridge singleton).
 */
const B10CKS_PACKAGES = ['@b10cks/vue', '@b10cks/client', '@b10cks/richtext']

export * from './types'
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@b10cks/nuxt',
    configKey: 'b10cks',
  },
  defaults: {
    accessToken: '',
    apiUrl: 'https://api.b10cks.com/api',
    componentsDir: '~/b10cks',
  },
  setup(options: ModuleOptions, nuxt: Nuxt) {
    const resolver = createResolver(import.meta.url)

    if (options.componentsDir) {
      addComponentsDir({ path: options.componentsDir, global: true, pathPrefix: false })
    }

    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))
    // Bare specifiers, not `resolver.resolve(...)`: the resolver only joins
    // paths against this module's directory, so a package name would become a
    // nonexistent `<module dir>/@b10cks/vue` path that matches nothing.
    nuxt.options.build.transpile.push(...B10CKS_PACKAGES)

    // Keep exactly one copy of each package in the client bundle. Vite's
    // dependency optimizer otherwise pre-bundles its own copy for the browser
    // while SSR resolves another via `ssr.noExternal`; the packages hold
    // module-scoped state (Vue injection keys, the preview bridge singleton),
    // so a second copy breaks `useB10cksApi()` during hydration with
    // "B10cks data API was not found in Vue injection context".
    extendViteConfig((config) => {
      config.resolve ||= {}
      config.resolve.dedupe = [...(config.resolve.dedupe ?? []), ...B10CKS_PACKAGES]
      config.optimizeDeps ||= {}
      config.optimizeDeps.exclude = [...(config.optimizeDeps.exclude ?? []), ...B10CKS_PACKAGES]
    })

    // Merge instead of overwrite so values set directly in
    // `runtimeConfig.public.b10cks` (or via NUXT_PUBLIC_B10CKS_* env) win over
    // the module options.
    nuxt.options.runtimeConfig.public.b10cks = defu(nuxt.options.runtimeConfig.public.b10cks, {
      accessToken: options.accessToken,
      apiUrl: options.apiUrl,
      scrollOffset: options.scrollOffset,
      allowedOrigins: options.allowedOrigins,
    })

    addPlugin(resolver.resolve('./runtime/plugin'))

    addImports([
      {
        name: 'useB10cksApi',
        as: 'useB10cksApi',
        from: resolver.resolve('./runtime/composables/useB10cksApi'),
      },
      {
        name: 'usePageTranslations',
        as: 'usePageTranslations',
        from: resolver.resolve('./runtime/composables/usePageTranslations'),
      },
      {
        name: 'usePreviewContent',
        as: 'usePreviewContent',
        from: '@b10cks/vue',
      },
      {
        name: 'toRootBlock',
        as: 'toRootBlock',
        from: '@b10cks/vue',
      },
    ])

    nuxt.options.typescript.hoist.push('@b10cks/vue')
  },
})
