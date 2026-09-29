<script lang="ts">
  let { block }: { block: { title?: string } } = $props()
</script>

<p>{block.title ?? 'hero'}</p>
