# @b10cks/nuxt

Nuxt 4 module for integrating b10cks into Nuxt applications.

## Installation

```bash
npm install @b10cks/nuxt @b10cks/vue @b10cks/client @b10cks/richtext
```

## Setup

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@b10cks/nuxt'],
  b10cks: {
    accessToken: 'your-access-token',
    apiUrl: 'https://api.b10cks.com/api',
    componentsDir: '~/b10cks',
  },
})
```

## Usage

```typescript
const { useContent, useRedirects, useB10cksConfig } = useB10cksApi()

const page = useContent('home')
const redirects = useRedirects()
const { config } = await useB10cksConfig()
```

`B10cksComponent`, `v-editable`, and `v-editable-field` are available through the Vue integration.

## Rich text usage

Use `B10cksRichText` to render a TipTap-based rich text document from b10cks on the server and client.

```vue
<script setup lang="ts">
const { useContent } = useB10cksApi()
const page = useContent<{ body?: Record<string, unknown> }>('home')
</script>

<template>
  <div v-if="page.pending">Loading...</div>

  <B10cksRichText
    v-else
    :document="page.data?.body"
    class="prose"
  />
</template>
```

If you need to render HTML manually, you can use `renderRichText`:

```typescript
import { renderRichText } from '@b10cks/nuxt'

const html = renderRichText(document)
```

## License

MIT
