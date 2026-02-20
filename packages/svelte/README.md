# @b10cks/svelte

Svelte SDK for integrating b10cks into Svelte applications.

## Installation

```bash
npm install @b10cks/svelte @b10cks/client
```

## Usage

```svelte
<script lang="ts">
  import { createB10cksContext, createB10cksStores } from '@b10cks/svelte'

  createB10cksContext({
    apiClientOptions: {
      token: 'your-access-token',
      baseUrl: 'https://api.b10cks.com/api',
    },
  })

  const { useContent } = createB10cksStores()
  const content = useContent('home')
</script>
```

## License

MIT
