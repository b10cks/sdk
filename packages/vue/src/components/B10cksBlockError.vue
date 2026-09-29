<script setup lang="ts">
import { type IBContentBlock, previewBridge } from '@b10cks/client'
import { computed } from 'vue'

import { EditableDirective as vEditable } from '../directives/v-editable'

const props = defineProps<{
  block: IBContentBlock<string>
  error: unknown
}>()

// Selectable in the preview, so editors can fix or delete the block. Nothing in production.
const preview = previewBridge.isInPreviewMode()
const message = computed(() =>
  props.error instanceof Error ? props.error.message : String(props.error)
)
</script>

<template>
  <div
    v-if="preview"
    v-editable="block"
    data-b10cks-error
    style="
      padding: 8px 12px;
      border: 1px dashed #dc2626;
      border-radius: 4px;
      color: #b91c1c;
      background: #fef2f2;
      font:
        13px/1.4 system-ui,
        sans-serif;
    "
  >
    Block "{{ block.block || 'unknown' }}" failed to render: {{ message }}
  </div>
</template>
