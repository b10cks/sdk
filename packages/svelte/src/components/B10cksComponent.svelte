<script lang="ts">
  import type { ComponentType } from 'svelte'
  import B10cksFallback from './B10cksFallback.svelte'

  export let block: { block?: string } & Record<string, unknown> = {}
  export let components: Record<string, ComponentType> = {}
  export let fallback: ComponentType | null = null

  function toPascalCase(name: string): string {
    return name
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
  }

  $: blockType = block?.block || ''
  $: componentName = toPascalCase(blockType)
  $: resolvedComponent =
    components[blockType] || components[componentName] || components[componentName.toLowerCase()]
  $: Renderer = resolvedComponent || fallback || B10cksFallback
</script>

<svelte:component
  this={Renderer}
  block={block}
/>
