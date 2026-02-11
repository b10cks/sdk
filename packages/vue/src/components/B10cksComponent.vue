<script setup lang="ts">
import type { IBContent } from '@b10cks/client'
import { computed, inject, resolveDynamicComponent, useTemplateRef } from 'vue'

import { B10cksComponentResolverKey } from '../types'
import B10cksFallback from './B10cksFallback.vue'

const props = defineProps<{
  block: IBContent<string> & Record<string, never>
}>()

const blockRef = useTemplateRef('blockRef')
defineExpose({ value: blockRef })

const customResolver = inject(B10cksComponentResolverKey, null)

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
    ref="blockRef"
    v-bind="{ ...$props, ...$attrs }"
  />
</template>
