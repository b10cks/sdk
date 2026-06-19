# @b10cks/svelte

Svelte SDK for integrating [b10cks](https://www.b10cks.com), the open-source headless CMS, into Svelte applications.

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

If you need to render rich text to an HTML string or plain text yourself, use the shared renderers from `@b10cks/richtext`:

```ts
import { renderRichText, renderRichTextAsText } from '@b10cks/richtext'

const html = renderRichText(document)
const text = renderRichTextAsText(document)
// or with a custom block separator (e.g. for meta descriptions):
const inline = renderRichTextAsText(document, { blockSeparator: ' ' })
```

## License

MIT
