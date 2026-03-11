# @b10cks/svelte

Svelte SDK for integrating b10cks into Svelte applications.

## Installation

```bash
npm install @b10cks/svelte @b10cks/client @b10cks/richtext
```

## Usage

```svelte
<script lang="ts">
  import { createB10cksContext, createB10cksStores } from '@b10cks/svelte'

  createB10cksContext({
    apiClientOptions: {
      token: 'your-access-token',
      baseUrl: 'https://api.b10cks.com/api',
    },
  })

  const { useContent } = createB10cksStores()
  const content = useContent('home')
</script>
```

## Rich text

Use `B10cksRichText` to render a b10cks TipTap-based rich text document with the default b10cks-compatible TipTap extensions.

```svelte
<script lang="ts">
  import { B10cksRichText, createB10cksContext, createB10cksStores } from '@b10cks/svelte'

  createB10cksContext({
    apiClientOptions: {
      token: 'your-access-token',
      baseUrl: 'https://api.b10cks.com/api',
    },
  })

  const { useContent } = createB10cksStores()
  const page = useContent<{ body?: import('@b10cks/svelte').RichTextDocument }>('home')
</script>

{#if $page.data?.body}
  <B10cksRichText
    document={$page.data.body}
    class="prose"
  />
{/if}
```

If you need to render rich text to an HTML string yourself, use the shared renderer from `@b10cks/richtext`.

## License

MIT
