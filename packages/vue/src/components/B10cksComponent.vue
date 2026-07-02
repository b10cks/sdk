<script setup lang="ts">
import type { IBContent } from '@b10cks/client'
import { computed, type Component, defineAsyncComponent, inject, resolveDynamicComponent } from 'vue'

import { B10cksComponentResolverKey } from '../types'
import B10cksFallback from './B10cksFallback.vue'

const props = defineProps<{
  block: IBContent<string> & Record<string, never>
}>()

const customResolver = inject(B10cksComponentResolverKey, null)

// Cache async component definitions per name. Without this, every recompute of
// `resolvedComponent` (e.g. a live-preview CONTENT_UPDATE) returns a brand-new
// component type, so <component :is> unmounts and remounts the whole subtree —
// losing focus/state and re-running child onMounted hooks.
const asyncComponentCache = new Map<string, Component>()

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
      const cached = asyncComponentCache.get(pascalCaseName)
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
      asyncComponentCache.set(pascalCaseName, asyncComponent)
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

const componentName = computed(() => props.block?.block || null)
</script>

<template>
  <component
    :is="resolvedComponent"
    v-if="resolvedComponent"
    v-bind="{ ...$props, ...$attrs }"
  />
</template>
