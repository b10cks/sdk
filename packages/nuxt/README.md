# @b10cks/nuxt

Nuxt 4 module for integrating b10cks into Nuxt applications.

## Installation

```bash
npm install @b10cks/nuxt @b10cks/vue @b10cks/client
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

## License

MIT
