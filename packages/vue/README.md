# @b10cks/vue

Vue 3 SDK for integrating [b10cks](https://www.b10cks.com), an open-source headless CMS with a composable block-based content API, into Vue applications.

## Installation

```bash
npm install @b10cks/vue @b10cks/client @b10cks/richtext
```

Or let the CLI install the packages, register the plugin, and write `.env` for you:

```bash
npx @b10cks/cli init
```

## Usage

### Plugin Setup

Keep the access token in `.env` rather than in source. On Vite:

```bash
# .env
VITE_B10CKS_TOKEN=your-access-token
```

```typescript
import { createApp } from 'vue'
import { B10cksVue } from '@b10cks/vue'
import App from './App.vue'

const app = createApp(App)

app.use(B10cksVue, {
  apiClientOptions: {
    token: import.meta.env.VITE_B10CKS_TOKEN ?? '',
    baseUrl: 'https://api.b10cks.com/api',
  },
})

app.mount('#app')
```

### Data Composables

```typescript
import { useB10cksApi } from '@b10cks/vue'

const { useContent, useContents, useBlocks } = useB10cksApi()

// Single content entry by slug
const content = useContent('home', { vid: 'published' }, { immediate: true })

// List of content entries — params accepts a typed filter object
const { data: items } = useContents(
  {
    language_iso: 'en',
    vid: 'published',
    filter: {
      canonical_id: { in: [someId] },
    },
  },
  { immediate: Boolean(someId) }
)

const blocks = useBlocks({}, { immediate: true })
```

The `immediate` option controls whether the request fires on composable setup (`true`) or must be triggered manually (`false`). Pass `immediate: false` to defer requests that depend on reactive values not yet available.

### Components

Use `B10cksComponent` to render block-specific Vue components dynamically:

```vue
<B10cksComponent :block="block" v-editable="block" />
```

## Live preview & visual editing

When your app is rendered inside the b10cks visual editor, these directives and the `usePreviewContent` composable make blocks selectable and keep the preview in sync while editing. They are all no-ops outside the editor, so they are safe to leave in production output.

### Directives

```vue
<!-- Mark a block as selectable: click selects it; the editor highlights/scrolls to it.
     It also live-updates in place when the editor pushes changes for this block. -->
<section v-editable="block">…</section>

<!-- Inline-edit a simple string field (contenteditable, streams plain-text edits) -->
<h1 v-editable-field="{ id: block.id, field: 'headline' }">{{ block.headline }}</h1>

<!-- Rich text / complex fields: deep-select so the editor opens its own editor.
     Use `mode: 'select'` with a `path` instead of inline editing. -->
<B10cksRichText
  :document="block.body"
  v-editable-field="{ id: block.id, path: ['body'], mode: 'select' }"
/>
```

### `usePreviewContent` (recommended)

`v-editable` patches a single block in place, which is enough for simple cases. For whole-tree reactive updates — including nested and rich text fields — wrap your fetched content in `usePreviewContent`. It returns a reactive ref that live-updates from the editor and is unchanged outside preview mode:

```vue
<script setup lang="ts">
import { usePreviewContent } from '@b10cks/vue'

const { data } = useContent('home')
// Pass a getter (or ref) so the preview resets when the content is refetched
// on a route/locale change instead of keeping the first tree.
const content = usePreviewContent(() => data.value.content)
</script>

<template>
  <B10cksComponent :block="content" />
</template>
```

`usePreviewContent` accepts a plain value, a `ref`, or a getter. A plain value is captured once; a reactive source resets the preview store whenever it changes.

### Plugin options

```typescript
app.use(B10cksVue, {
  apiClientOptions: { token, baseUrl },
  // Offset applied when a selected block is scrolled into view, so selection
  // clears a fixed app header. A number is px; strings are used verbatim.
  scrollOffset: 80,
  // Restrict the preview bridge handshake to known editor origins.
  allowedOrigins: ['https://app.b10cks.com'],
})
```

`scrollOffset` can also be set purely in CSS — `:root { --b10cks-scroll-offset: 80px }` — with no plugin option.

## Rich Text

Rich text exports live in the `@b10cks/vue/rich-text` sub-path, so pages that do not render rich text keep it out of their entry bundle.

Use `B10cksRichText` to render a b10cks `RichTextDocument` (a TipTap/ProseMirror-style JSON document) as HTML with a dependency-free, SSR-friendly renderer.

```vue
<script setup lang="ts">
import type { RichTextDocument } from '@b10cks/vue/rich-text'
import { B10cksRichText } from '@b10cks/vue/rich-text'

const document: RichTextDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Hello from b10cks rich text in Vue.',
        },
      ],
    },
  ],
}
</script>

<template>
  <B10cksRichText
    :document="document"
    class="prose"
  />
</template>
```

You can also render rich text to an HTML string manually:

```typescript
import type { RichTextDocument } from '@b10cks/vue/rich-text'
import { renderRichText } from '@b10cks/vue/rich-text'

const document: RichTextDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Render me to HTML',
        },
      ],
    },
  ],
}

const html = renderRichText(document)
```

To extract plain text (useful for search indexing or meta descriptions), use `renderRichTextAsText`:

```typescript
import type { RichTextDocument } from '@b10cks/vue/rich-text'
import { renderRichTextAsText } from '@b10cks/vue/rich-text'

const text = renderRichTextAsText(document)
// or with a custom block separator:
const inline = renderRichTextAsText(document, { blockSeparator: ' ' })
```

For repeated rendering, use the factory:

```typescript
import { createRichTextTextRenderer } from '@b10cks/vue/rich-text'

const renderer = createRichTextTextRenderer()
const text = renderer.render(document)
```

### Internal link handler

b10cks internal links carry a `url`, `title`, `anchor`, and `content` (block ID) in their attrs. Pass an `internalLinkHandler` to customise how the `href` is generated — for example to prepend a route prefix or resolve content IDs via Vue Router:

```vue
<script setup lang="ts">
import { B10cksRichText } from '@b10cks/vue/rich-text'
import type { RichTextInternalLinkAttrs } from '@b10cks/vue/rich-text'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <B10cksRichText
    :document="document"
    :internal-link-handler="
      (attrs: RichTextInternalLinkAttrs) => router.resolve(attrs.url ?? '/').href
    "
  />
</template>
```

Or when rendering to a string:

```typescript
import { renderRichText } from '@b10cks/vue/rich-text'

const html = renderRichText(document, {
  internalLinkHandler: (attrs) => `/app${attrs.url}`,
})
```

Return `null` or `undefined` from the handler to fall back to the default `url`/`href` attribute value.

### Placeholder tokens

Pass a `placeholderHandler` to resolve `{token}` placeholders embedded in rich text to real values. Return `null`/`undefined` to leave a token unresolved.

```typescript
import { renderRichText } from '@b10cks/vue/rich-text'

const html = renderRichText(document, {
  placeholderHandler: (key) => ({ companyName: 'b10cks' })[key],
})
```

`B10cksRichText` also exposes `placeholderHandler` as a prop, alongside `internalLinkHandler`.

### URL safety

Link and image URLs from CMS content are validated against a scheme allowlist (default `http`/`https`/`mailto`/`tel`, plus relative URLs), so stored `javascript:` URLs cannot execute. Override the allowlist with the `allowedSchemes` prop / render option — see the [`@b10cks/richtext` URL safety docs](../richtext/README.md#url-safety).

```vue
<B10cksRichText :document="doc" :allowed-schemes="['https', 'mailto']" />
```

> **Custom extensions are no longer used.** The renderer is a custom, dependency-free implementation — it does not run TipTap. The `extensions` prop and `createB10cksRichTextExtensions()` remain as no-op stubs for backwards compatibility only.

> **Migrating from v1:** `renderRichText` and `B10cksRichText` were previously exported from `@b10cks/vue`. Update all imports to `@b10cks/vue/rich-text`.

## License

MIT
