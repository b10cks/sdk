# @b10cks/vue

Vue 3 SDK for integrating b10cks into your Vue applications.

## Installation

```bash
npm install @b10cks/vue @b10cks/client
```

## Usage

### Plugin Setup

```typescript
import { createApp } from 'vue'
import { B10cksVue } from '@b10cks/vue'
import app from './App.vue'

const app = createApp(App)

app.use(B10cksVue, {
  accessToken: 'your-access-token',
  apiUrl: 'https://api.b10cks.com/api',
})

app.mount('#app')
```

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
Render b10cks components directly in your Vue app.

```vue
<B10cksComponent :component="componentData" />
```

## API Client

Access the underlying API client for direct API calls:

```typescript
import { ApiClient } from '@b10cks/client'

const client = new ApiClient(
  {
    baseUrl: 'https://api.b10cks.com/api',
    token: 'your-token',
    fetchClient: fetch,
  },
  new URL(window.location.href)
)

const blocks = await client.get('blocks')
```

## License

MIT
