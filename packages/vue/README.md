# @b10cks/vue

Vue 3 SDK for integrating [b10cks](https://www.b10cks.com), an open-source headless CMS with a composable block-based content API, into Vue applications.

## Installation

```bash
npm install @b10cks/vue @b10cks/client @b10cks/richtext
```

## Usage

### Plugin Setup

```typescript
import { createApp } from 'vue'
import { B10cksVue } from '@b10cks/vue'
import App from './App.vue'

const app = createApp(App)

app.use(B10cksVue, {
  apiClientOptions: {
    token: 'your-access-token',
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

### Directives

- `v-editable` marks a block as selectable inside the b10cks preview editor.
- `v-editable-field` marks a field as inline-editable in preview mode.

### Components

Use `B10cksComponent` to render block-specific Vue components dynamically:

```vue
<B10cksComponent :block="block" v-editable="block" />
```

### Rich Text

Rich text exports live in the `@b10cks/vue/rich-text` sub-path. Importing from this path keeps the TipTap and ProseMirror runtime out of your entry bundle on pages that do not render rich text.

Use `B10cksRichText` to render a b10cks TipTap `RichTextDocument` as HTML with an SSR-friendly renderer powered by `@tiptap/html`.

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

#### Internal link handler

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
    :internal-link-handler="(attrs: RichTextInternalLinkAttrs) => router.resolve(attrs.url ?? '/').href"
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

#### Custom extensions

If you need to override the default b10cks TipTap extension set entirely, pass custom `extensions`:

```vue
<script setup lang="ts">
import { B10cksRichText } from '@b10cks/vue/rich-text'
import { createB10cksRichTextExtensions, type RichTextDocument } from '@b10cks/richtext'

const document: RichTextDocument = {
  type: 'doc',
  content: [],
}

const extensions = createB10cksRichTextExtensions()
</script>

<template>
  <B10cksRichText
    :document="document"
    :extensions="extensions"
  />
</template>
```

> **Migrating from v1:** `renderRichText` and `B10cksRichText` were previously exported from `@b10cks/vue`. Update all imports to `@b10cks/vue/rich-text`.

## License

MIT
