# @b10cks/nuxt

A Nuxt 4 module for seamless b10cks CMS integration. Provides composables for fetching and managing content, automatic client injection, and full TypeScript support.

## Features

- **Auto-imported Composables**: All `useB10cks*` composables are auto-imported
- **Server-Side Rendering**: Full SSR support with proper data hydration
- **Type-Safe Composables**: Comprehensive composable API with TypeScript support
- **Automatic Client Injection**: Access the API client via `$b10cksClient`
- **Revision Tracking**: Built-in revision management for cache invalidation
- **Plugin Auto-Registration**: Zero-config setup
- **Zero-config Module**: Works out of the box with sensible defaults

## Installation

```bash
npm install @b10cks/nuxt @b10cks/client nuxt
# or
pnpm add @b10cks/nuxt @b10cks/client nuxt
# or
yarn add @b10cks/nuxt @b10cks/client nuxt
```

## Setup

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@b10cks/nuxt'],
  b10cks: {
    baseUrl: process.env.B10CKS_BASE_URL,
    token: process.env.B10CKS_TOKEN,
  },
})
```

### Configuration

```typescript
export default defineNuxtConfig({
  modules: ['@b10cks/nuxt'],
  b10cks: {
    baseUrl: 'https://api.b10cks.io',
    token: 'your-api-token',
    version: 'published', // 'draft' or 'published'
  },
})
```

**Options:**
- `baseUrl` (string, required): The b10cks API base URL
- `token` (string, required): Your API authentication token
- `version` ('draft' | 'published', optional): Default content version. Defaults to 'published'

## Usage

### Auto-Imported Composables

All composables are automatically imported and available in your pages and components:

```vue
<template>
  <div>
    <h1 v-if="pending">Loading...</h1>
    <div v-else-if="error" class="error">{{ error.message }}</div>
    <div v-else>
      <h1>{{ data?.name }}</h1>
      <p>{{ data?.slug }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// No import needed - automatically available!
const { data, pending, error } = await useContent('my-page')
</script>
```

### useContent

Fetch a single content item by slug.

```typescript
const { data, pending, error, refresh } = useContent(
  'my-page',
  { language_iso: 'en' },
  { immediate: true }
)
```

**Parameters:**
- `full_slug` (string): The content slug to fetch
- `params` (optional): Query parameters
- `options` (optional): Composable options

**Returns:**
- `data`: Ref containing the content item or null
- `pending`: Ref indicating loading state
- `error`: Ref containing any error that occurred
- `execute`: Function to manually trigger the fetch
- `refresh`: Alias for execute()

### useContents

Fetch a collection of content items with pagination.

```typescript
const { data, pending, error, refresh } = useContents(
  { language_iso: 'en', type: 'blog_post' },
  { immediate: false }
)

await refresh()
```

**Parameters:**
- `params` (optional): Query parameters (page, per_page, language_iso, etc.)
- `options` (optional): Composable options

**Returns:** Same as useContent

### useBlocks

Fetch all available content blocks.

```typescript
const { data, pending, error } = useBlocks({
  sort: 'name',
  per_page: 100,
})
```

### useDataSources

Fetch all data sources configured in your space.

```typescript
const { data, pending, error } = useDataSources()

// Access a specific data source
const datasource = data.value?.find(ds => ds.slug === 'team')
```

### useDataEntries

Fetch entries from a specific data source.

```typescript
const { data, pending, error } = useDataEntries(
  'team', // datasource slug
  { page: 1, per_page: 10 }
)
```

### useSpace

Get information about the current space.

```typescript
const { data: space } = useSpace()

console.log(space.value?.name)
```

### useRedirects

Fetch redirect mappings (useful for handling old URLs).

```typescript
const { data: redirects } = useRedirects()

// Access as: redirects.value['/old-path']?.target
```

### useApiResource

Low-level composable for fetching any API endpoint as a single resource.

```typescript
const { data, pending, error } = useApiResource(
  'blocks',
  {
    immediate: true,
    params: { sort: 'name' },
    transform: (response) => {
      // Custom transform function
      return response.data
    },
  }
)
```

### useApiCollection

Low-level composable for fetching paginated collections.

```typescript
const { data, pending, error } = useApiCollection(
  'contents',
  {
    immediate: true,
    params: { language_iso: 'en' },
  }
)
```

### useB10cksConfig

Load site configuration from a special `_config` content item.

```typescript
const { config } = await useB10cksConfig()

// Or from a custom slug
const { config } = await useB10cksConfig({
  slug: 'site-settings',
  language_iso: 'en',
})
```

### Accessing the API Client

The b10cks API client is automatically injected and available via `useNuxtApp()`:

```typescript
const { $b10cksClient } = useNuxtApp()

// Make custom API calls
const customData = await $b10cksClient.get('blocks')
```

Or from within a composable:

```typescript
const { useB10cksApi } = useB10cksApi()

const client = useB10cksApi().client
```

## Composable Options

All composables accept an options object:

```typescript
interface UseB10cksApiOptions<T> {
  immediate?: boolean    // Auto-execute on component mount (default: true)
  params?: Record<string, any>  // Query parameters
  transform?: (data) => T // Custom data transform function
}
```

## Examples

### Display a Blog Post

```vue
<template>
  <article v-if="data">
    <h1>{{ data.name }}</h1>
    <time>{{ data.published_at }}</time>
    <div class="content">
      {{ data.content }}
    </div>
  </article>
  <div v-else-if="error" class="error">
    Failed to load post: {{ error.message }}
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blog' })

const route = useRoute()
const { data, error } = useContent(route.params.slug as string)
</script>
```

### List Content with Pagination

```vue
<template>
  <div>
    <div v-if="pending" class="spinner">Loading...</div>
    <ul v-else>
      <li v-for="item in data" :key="item.id">
        <NuxtLink :to="`/content/${item.slug}`">
          {{ item.name }}
        </NuxtLink>
      </li>
    </ul>
    <button @click="loadMore">Load More</button>
  </div>
</template>

<script setup lang="ts">
const params = ref({
  page: 1,
  per_page: 20,
  language_iso: 'en',
})

const { data, pending, execute } = useContents(params, {
  immediate: true,
})

async function loadMore() {
  params.value.page++
  await execute()
}
</script>
```

### Using with NuxtImage

Combine with Nuxt Image for optimized image handling:

```vue
<template>
  <NuxtImg
    v-if="data?.content?.image"
    :src="data.content.image.url"
    :alt="data.content.image.alt"
    width="800"
    height="400"
  />
</template>

<script setup lang="ts">
const { data } = useContent('hero-banner')
</script>
```

## SSR Considerations

The module fully supports SSR:

```typescript
export default defineNuxtConfig({
  modules: ['@b10cks/nuxt'],
  b10cks: {
    baseUrl: 'https://api.b10cks.io',
    token: process.env.B10CKS_TOKEN,
  },
  ssr: true, // Enable SSR
  routeRules: {
    '/blog/**': { swr: 3600 }, // Cache blog routes
    '/': { swr: 1800 }, // Cache homepage
  },
})
```

Data is automatically hydrated on the client, avoiding double-fetching.

## Type Safety

All composables are fully typed. TypeScript will infer the return types:

```typescript
const { data } = useContent<{ title: string; body: string }>(
  'blog-post'
)

// data is typed as Ref<IBContent<{ title: string; body: string }> | null>
```

## Error Handling

All composables provide an error ref:

```typescript
const { data, error, pending, execute } = useContent('my-page')

watch(error, (err) => {
  if (err) {
    console.error('Failed to fetch content:', err.message)
    // Show error toast, etc.
  }
})
```

## Performance Tips

1. **Use `immediate: false` for non-critical data**:
   ```typescript
   const { data, execute } = useContent('sidebar', {}, { immediate: false })

   onMounted(() => execute())
   ```

2. **Leverage Nuxt's route rules for caching**:
   ```typescript
   routeRules: {
     '/products/**': { cache: { maxAge: 60 * 10 } }
   }
   ```

3. **Use composable options to transform data**:
   ```typescript
   const { data } = useContents({}, {
     transform: (response) => response.data.filter(item => item.published_at)
   })
   ```

## Browser Support

Requires Nuxt 4.0+ and modern browsers with ES2020+ support.

## License

MIT
