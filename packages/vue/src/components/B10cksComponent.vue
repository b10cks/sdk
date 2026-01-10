<script setup lang="ts">
import type { IBContent } from '@b10cks/client'
import { type Component, computed, defineAsyncComponent, shallowRef, useTemplateRef, watch } from 'vue'

const props = defineProps<{
  block: IBContent<string> & Record<string, never>
}>()

const blockRef = useTemplateRef('blockRef')
defineExpose({ value: blockRef })

const resolvedComponent = shallowRef<Component | null>(null)
const componentName = computed(() => props.block?.block || null)

watch(
  () => componentName.value,
  async (newComponentName: string | null) => {
    if (!newComponentName) {
      resolvedComponent.value = null
      return
    }

    const pascalCaseBlockType = newComponentName
      .replace(/^([a-z])/, (match: string) => match.toUpperCase())
      .replace(/([a-z])([A-Z])/g, '$1$2')

    try {
      resolvedComponent.value = defineAsyncComponent({
        loader: () => import(`~/b10cks/${pascalCaseBlockType}.vue`),
        timeout: 3000,
        onError: (error, _, fail) => {
          // biome-ignore lint/suspicious/noConsole: give developers feedback
          console.warn(`Failed to load block component for type "${newComponentName}":`, error)
          fail()
        },
      })
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: give developers feedback
      console.error(`Error resolving component for block type "${newComponentName}":`, error)
    }
  },
  { immediate: true }
)
</script>
<template>
  <component :is="resolvedComponent" v-if="resolvedComponent" ref="blockRef" v-bind="{ ...$props, ...$attrs }" />
  <div v-else>Component for block type "{{ componentName }}" not found.</div>
</template>
