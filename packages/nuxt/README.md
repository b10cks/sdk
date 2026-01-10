# @b10cks/nuxt

Nuxt 4 module for integrating b10cks into your Nuxt applications.

## Installation

```bash
npm install @b10cks/nuxt @b10cks/vue @b10cks/client
```

## Setup

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ['@b10cks/nuxt'],
  b10cks: {
    accessToken: 'your-access-token',
    apiUrl: 'https://api.b10cks.com/api',
    componentsDir: '~/b10cks', // Optional: custom components directory
  },
})
```

## Usage

### Directives

#### `v-editable`
Mark content as editable within the b10cks editor.

```vue
<div v-editable="block">
  Content here
</div>
```

#### `v-editable-field`
Mark specific fields within editable blocks.

```vue
<div v-editable="block">
  <h1 v-editable-field="{ id: block.id, field: 'title' }">Title</h1>
  <p v-editable-field="{ id: block.id, field: 'description' }">Description</p>
</div>
```

### Components

#### `B10cksComponent`
Render b10cks components directly in your Nuxt app.

```vue
<B10cksComponent :component="componentData" />
```

### Custom Components

Place your custom b10cks components in the `~/b10cks` directory (or your configured `componentsDir`). They will be auto-imported as global components.

## Configuration

- `accessToken` - Your b10cks API access token (required)
- `apiUrl` - The b10cks API endpoint (default: `https://api.b10cks.com/api`)
- `componentsDir` - Directory for custom components (default: `~/b10cks`)

## License

MIT
