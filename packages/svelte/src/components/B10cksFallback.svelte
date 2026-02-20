<script lang="ts">
  export let block: { block?: string } & Record<string, unknown> = {}
</script>

<div>Component for block type "{block?.block || 'unknown'}" not found.</div>
