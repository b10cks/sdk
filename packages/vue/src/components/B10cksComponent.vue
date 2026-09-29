<script lang="ts">
import type { Component } from 'vue'

import type { BlockComponentResolver } from '../types'

// Cache async component definitions per resolver and name, at module scope so
// every B10cksComponent instance shares one definition. Without this, every
// recompute of `resolvedComponent` (e.g. a live-preview CONTENT_UPDATE) returns
// a brand-new component type, so <component :is> unmounts and remounts the
// whole subtree — losing focus/state and re-running child onMounted hooks —
// and each block instance re-runs the resolver's loader.
/**
 * Vue's error info for event handler errors, in development and production
 * builds. Those leave the rendered block intact, as in React error boundaries.
 */
const HANDLER_ERROR = /event handler|#runtime-[56]$/

const asyncComponentCaches = new WeakMap<BlockComponentResolver, Map<string, Component>>()

function getAsyncComponentCache(resolver: BlockComponentResolver): Map<string, Component> {
  let cache = asyncComponentCaches.get(resolver)
  if (!cache) {
    cache = new Map()
    asyncComponentCaches.set(resolver, cache)
  }
  return cache
}
</script>

<script setup lang="ts">
import type { IBContentBlock } from '@b10cks/client'
import {
  computed,
  defineAsyncComponent,
  getCurrentInstance,
  inject,
  onErrorCaptured,
  resolveDynamicComponent,
  shallowRef,
  watch,
} from 'vue'

import { B10cksComponentResolverKey } from '../types'
import B10cksBlockError from './B10cksBlockError.vue'
import B10cksFallback from './B10cksFallback.vue'

const props = defineProps<{
  block: IBContentBlock<string>
}>()

const customResolver = inject(B10cksComponentResolverKey, null)

// One broken block must not take down the page: it is replaced by a
// placeholder in the preview and by nothing in production, and reported once
// to the app's errorHandler, or the console without one.
const failure = shallowRef<{ error: unknown } | null>(null)
const appErrorHandler = getCurrentInstance()?.appContext.config.errorHandler
onErrorCaptured((error, instance, info) => {
  if (HANDLER_ERROR.test(info)) return
  failure.value = { error }
  if (appErrorHandler) {
    appErrorHandler(error, instance, info)
  } else {
    // biome-ignore lint/suspicious/noConsole: report the error once
    console.error(`[b10cks] Block "${props.block?.block}" failed to render.`, error)
  }
  return false
})
// A new block object, e.g. after an edit in the editor, gets another try.
watch(
  () => props.block,
  () => {
    failure.value = null
  }
)

// Convert component name to PascalCase synchronously
function toPascalCase(name: string): string {
  return name
    .split(/[-_]/)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .replace(/^([a-z])/, (match: string) => match.toUpperCase())
}

// Compute the component synchronously for SSR compatibility
const resolvedComponent = computed(() => {
  const componentName = props.block?.block

  if (!componentName) {
    return null
  }

  const pascalCaseName = toPascalCase(componentName)

  // Use Vue's built-in resolveDynamicComponent which works in SSR
  // This resolves globally registered components automatically
  const component = resolveDynamicComponent(pascalCaseName)

  // resolveDynamicComponent returns a string if component not found
  if (typeof component === 'string') {
    if (customResolver) {
      const cache = getAsyncComponentCache(customResolver)
      const cached = cache.get(pascalCaseName)
      if (cached) {
        return cached
      }
      const asyncComponent = defineAsyncComponent(async () => {
        try {
          return await customResolver(pascalCaseName)
        } catch {
          return B10cksFallback
        }
      })
      cache.set(pascalCaseName, asyncComponent)
      return asyncComponent
    }

    // biome-ignore lint/suspicious/noConsole: give developers feedback
    console.warn(
      `Component "${pascalCaseName}" not found. Make sure it's registered in your components directory.`
    )
    return B10cksFallback
  }

  return component
})
</script>

<template>
  <B10cksBlockError
    v-if="failure"
    :block="block"
    :error="failure.error"
  />
  <component
    :is="resolvedComponent"
    v-else-if="resolvedComponent"
    v-bind="{ ...$props, ...$attrs }"
  />
</template>
