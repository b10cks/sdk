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

`createB10cksContext` also accepts preview options:

```svelte
<script lang="ts">
  createB10cksContext({
    apiClientOptions: { token, baseUrl },
    // Offset applied when a selected block is scrolled into view, so selection
    // clears a fixed app header (number → px, or a string like '5rem').
    scrollOffset: 80,
    // Restrict the preview bridge handshake to known editor origins.
    allowedOrigins: ['https://app.b10cks.com'],
  })
</script>
```

## Live preview & visual editing

When your app is rendered inside the b10cks visual editor, these actions and the `createPreviewContent` store make blocks selectable and keep the preview in sync while editing. They are no-ops outside the editor, so they are safe to leave in production output.

```svelte
<script lang="ts">
  import { editable, editableField, createPreviewContent } from '@b10cks/svelte'

  export let block
  // Whole-tree reactive updates — incl. nested and rich text fields:
  const content = createPreviewContent(block)
</script>

<!-- Selectable block: click selects it; the editor highlights/scrolls to it -->
<section use:editable={$content}>
  <!-- Inline-edit a simple string field -->
  <h1 use:editableField={{ id: $content.id, field: 'headline' }}>{$content.headline}</h1>

  <!-- Rich text / complex fields: deep-select so the editor opens its own editor.
       Actions apply to DOM elements, so wrap the component in a container. -->
  <div use:editableField={{ id: $content.id, path: ['body'], mode: 'select' }}>
    <B10cksRichText document={$content.body} />
  </div>
</section>
```

`createPreviewContent` accepts either a plain value or a readable store. A plain value is captured once; pass a store (e.g. a data store that re-fetches on navigation) and its updates reset the preview so it never keeps a stale tree:

```svelte
<script lang="ts">
  import { createPreviewContent } from '@b10cks/svelte'
  import { page } from '$app/stores'
  import { derived } from 'svelte/store'

  const content = createPreviewContent(derived(page, ($p) => $p.data.content))
</script>
```

`scrollOffset` can also be set purely in CSS — `:root { --b10cks-scroll-offset: 80px }`.

## Rich text

Use `B10cksRichText` to render a b10cks `RichTextDocument` (a TipTap/ProseMirror-style JSON document) with a dependency-free, SSR-friendly renderer.

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

Link and image URLs are validated against a scheme allowlist (blocking `javascript:` and similar). `B10cksRichText` forwards `allowedSchemes` (and `placeholderHandler`) to the renderer — see the [`@b10cks/richtext` URL safety docs](../richtext/README.md#url-safety).

## License

MIT
