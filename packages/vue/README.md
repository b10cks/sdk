# @b10cks/vue

Vue 3 SDK for integrating b10cks into Vue applications.

## Installation

```bash
npm install @b10cks/vue @b10cks/client
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

## License

MIT
