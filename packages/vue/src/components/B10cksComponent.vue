<script setup lang="ts">
import type { IBContent } from '@b10cks/client'
import { computed, defineAsyncComponent, inject, shallowRef, useTemplateRef, watch } from 'vue'

import { B10cksComponentResolverKey } from '../types'

const props = defineProps<{
  block: IBContent<string> & Record<string, never>
}>()

const blockRef = useTemplateRef('blockRef')
defineExpose({ value: blockRef })

const resolvedComponent = shallowRef<ReturnType<typeof defineAsyncComponent> | null>(null)
const componentName = computed(() => props.block?.block || null)

const resolveBlockComponent = inject(B10cksComponentResolverKey, null)

watch(
  () => componentName.value,
  async (newComponentName: string | null) => {
    if (!newComponentName) {
      resolvedComponent.value = null
      return
    }

    if (!resolveBlockComponent) {
      // biome-ignore lint/suspicious/noConsole: give developers feedback
      console.error(
        'B10cks: No component resolver found. Make sure you are using @b10cks/nuxt module or have provided a custom resolver.'
      )
      resolvedComponent.value = null
      return
    }

    try {
      resolvedComponent.value = await resolveBlockComponent(newComponentName)
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: give developers feedback
      console.warn(`Failed to load block component for type "${newComponentName}":`, error)
      resolvedComponent.value = null
    }
  },
  { immediate: true }
)
</script>
<template>
  <component
    :is="resolvedComponent"
    v-if="resolvedComponent"
    ref="blockRef"
    v-bind="{ ...$props, ...$attrs }"
  />
  <div v-else>Component for block type "{{ componentName }}" not found.</div>
</template>
