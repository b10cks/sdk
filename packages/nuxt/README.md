# @b10cks/nuxt

Nuxt 4 module for integrating [b10cks](https://www.b10cks.com), the open-source headless CMS with a composable block-based content API.

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

const page = await useContent('home')
const redirects = await useRedirects()
const { config } = await useB10cksConfig()
```

The Nuxt helpers use Nuxt's `useAsyncData()` under the hood, so requests participate in SSR payload serialization and are not refetched again during or after hydration.

By default, each helper derives a stable async-data key from its input parameters, so SDK users do not need to provide a `key` manually.

`B10cksComponent`, `v-editable`, and `v-editable-field` are available through the Vue integration.

You can still pass `useAsyncData()` options when needed:

```typescript
const page = await useContent('home', { language: 'en' })
const { config, pending, error, refresh } = await useB10cksConfig({ language: 'en' })
```

If you need to override Nuxt's cache identity behavior, you can still provide a custom `key` through the async-data options.

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
