import { addComponentsDir, addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { ModuleOptions } from './types'

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
    nuxt.options.build.transpile.push(resolver.resolve('@b10cks/nuxt'))
    nuxt.options.build.transpile.push(resolver.resolve('@b10cks/vue'))

    nuxt.options.runtimeConfig.public.b10cks = {
      accessToken: options.accessToken,
      apiUrl: options.apiUrl,
    }

    addPlugin(resolver.resolve('./runtime/plugin'))

    addImports({
      name: 'useB10cksApi',
      as: 'useB10cksApi',
      from: resolver.resolve('./runtime/composables/useB10cksApi'),
    })

    nuxt.options.typescript.hoist.push('@b10cks/vue')
  },
})
