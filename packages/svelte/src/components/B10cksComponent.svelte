<script lang="ts">
  import { previewBridge } from '@b10cks/client'
  import type { Component, ComponentType } from 'svelte'
  import { untrack } from 'svelte'

  import { editable } from '../actions'
  import B10cksFallback from './B10cksFallback.svelte'

  type Block = { id?: string; block?: string } & Record<string, unknown>
  type BlockComponent = ComponentType | Component<{ block: Block }>

  interface Props {
    block?: Block
    /** Looked up by block slug, then its PascalCase and lowercase forms. */
    components?: Record<string, BlockComponent>
    fallback?: BlockComponent | null
  }

  let { block = {}, components = {}, fallback = null }: Props = $props()

  const blockType = $derived(block?.block || '')
  const Renderer = $derived.by(() => {
    const componentName = toPascalCase(blockType)
    return (
      components[blockType] ||
      components[componentName] ||
      components[componentName.toLowerCase()] ||
      fallback ||
      B10cksFallback
    )
  })

  let retry: (() => void) | null = null

  // A new block object, e.g. after an edit in the editor, gets another try.
  $effect(() => {
    void block
    untrack(() => {
      retry?.()
      retry = null
    })
  })

  // One broken block must not take down the page: it is replaced by a
  // placeholder in the preview and by nothing in production.
  function report(error: unknown, reset: () => void) {
    retry = reset
    console.error(`[b10cks] Block "${blockType}" failed to render.`, error)
  }

  function toPascalCase(name: string): string {
    return name
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }
</script>

<svelte:boundary onerror={report}>
  <Renderer {block} />

  {#snippet failed(error)}
    {#if previewBridge.isInPreviewMode()}
      <div
        use:editable={block}
        data-b10cks-error
        style="padding: 8px 12px; border: 1px dashed #dc2626; border-radius: 4px; color: #b91c1c; background: #fef2f2; font: 13px/1.4 system-ui, sans-serif;"
      >
        Block "{blockType || 'unknown'}" failed to render: {error instanceof Error
          ? error.message
          : String(error)}
      </div>
    {/if}
  {/snippet}
</svelte:boundary>
