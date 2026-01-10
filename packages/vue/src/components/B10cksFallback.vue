<script setup lang="ts">
import type { IBContent } from '@b10cks/client'

export interface IB10cksFallbackProps {
  block: IBContent
}

defineProps<IB10cksFallbackProps>()
</script>

<template>
  <div>Component for block type "{{ block.block }}" not found.</div>
</template>
