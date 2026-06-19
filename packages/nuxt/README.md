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

Each composable returns the same object as Nuxt's `useAsyncData()` — destructure `data`, `pending`, `error`, and `refresh` as needed.

```typescript
// Single content entry by slug
const { useContent } = useB10cksApi()
const { data: page, error } = await useContent('home')
if (error.value) throw error.value

// With query params (language, vid, etc.)
const { data: page } = await useContent('home', {
  language_iso: 'de',
  vid: 'published', // or 'draft'
})
```

```typescript
// List of content entries — params accepts the same filter object as dataApi.getContents()
const { useContents } = useB10cksApi()

// Plain params
const { data: items } = await useContents({ language_iso: 'en', vid: 'published' })

// Typed filter object (no wire-format string hacks needed)
const { data: people } = await useContents({
  language_iso: 'en',
  vid: 'published',
  filter: {
    canonical_id: { in: ['id-1', 'id-2'] },
  },
})
```

```typescript
// Redirects and config
const { useRedirects, useB10cksConfig } = useB10cksApi()
const redirects = await useRedirects()
const { data: config, pending, error, refresh } = await useB10cksConfig()
```

The helpers use Nuxt's `useAsyncData()` under the hood, so requests participate in SSR payload serialization and are not refetched during hydration. Each helper derives a stable async-data key from its inputs — no manual `key` needed.

### `B10cksComponent` and directives

`B10cksComponent`, `v-editable`, and `v-editable-field` are available globally after registering the module. `componentsDir` in the config tells the module where your block components live; it auto-registers them by block name.

```vue
<template>
  <!-- Renders the component matching content.block from componentsDir -->
  <B10cksComponent
    v-if="content"
    :block="{ id: content.id, block: content.block, ...content.content }"
    :content="content"
  />
</template>
```

```vue
<!-- Mark a block as selectable in the b10cks visual editor -->
<div v-editable="block">…</div>

<!-- Mark a specific field as inline-editable -->
<h1 v-editable-field="{ id: block.id, field: 'header' }">{{ block.header }}</h1>
```

If you need to override Nuxt's cache identity behavior, pass a custom `key` as a third argument to any composable.

## Page translations

`usePageTranslations` maintains a reactive `locale → path` map built from an `IBContent` entry and its `translations` array. Use it to drive language-switcher links without any extra API calls.

```vue
<script setup lang="ts">
const { useContent } = useB10cksApi()
const { translations, setFromContent, clear } = usePageTranslations()

const { data: content } = await useContent(slug, { language_iso: locale })
if (content.value) setFromContent(content.value)

onBeforeRouteLeave(() => clear())
</script>

<template>
  <!-- translations.value: { en: '/en/about', de: '/de/ueber-uns' } -->
  <NuxtLink
    v-for="(path, lang) in translations"
    :key="lang"
    :to="path"
  >{{ lang }}</NuxtLink>
</template>
```

`setFromContent` uses `buildLocalizedPath` from `@b10cks/client` internally, so paths are always correctly normalized and locale-prefixed. `setTranslations` lets you set the map manually when you need full control.

## Rich text usage

Use `B10cksRichText` to render a TipTap-based rich text document from b10cks on the server and client.

```vue
<script setup lang="ts">
const { useContent } = useB10cksApi()
const { data: page, pending } = await useContent<{ body?: Record<string, unknown> }>('home')
</script>

<template>
  <div v-if="pending">Loading…</div>

  <B10cksRichText
    v-else
    :document="page?.content?.body"
    class="prose"
  />
</template>
```

If you need to render HTML manually, you can use `renderRichText`:

```typescript
import { renderRichText } from '@b10cks/nuxt'

const html = renderRichText(document)
```

> **Migrating from v2:** `renderRichText` and `B10cksRichText` are re-exported from `@b10cks/vue/rich-text` via `@b10cks/nuxt`. Imports from `@b10cks/nuxt` continue to work — no import path change required for Nuxt consumers.

## License

MIT
