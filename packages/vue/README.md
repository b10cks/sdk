# @b10cks/vue

Vue 3 SDK for integrating b10cks into Vue applications.

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

const { useContent, useBlocks } = useB10cksApi()

const content = useContent('home', {}, { immediate: true })
const blocks = useBlocks({}, { immediate: true })
```

### Directives

- `v-editable` marks a block as selectable inside the b10cks preview editor.
- `v-editable-field` marks a field as inline-editable in preview mode.

### Components

Use `B10cksComponent` to render block-specific Vue components dynamically:

```vue
<B10cksComponent :block="block" v-editable="block" />
```

### Rich Text

Use `B10cksRichText` to render a b10cks TipTap `RichTextDocument` as HTML with an SSR-friendly renderer powered by `@tiptap/html`.

```vue
<script setup lang="ts">
import type { RichTextDocument } from '@b10cks/vue'
import { B10cksRichText } from '@b10cks/vue'

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
import type { RichTextDocument } from '@b10cks/vue'
import { renderRichText } from '@b10cks/vue'

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

If you need to override the default b10cks TipTap extension set, pass custom `extensions`:

```vue
<script setup lang="ts">
import { B10cksRichText } from '@b10cks/vue'
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

## License

MIT
