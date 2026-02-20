# @b10cks/react

React SDK for integrating b10cks into React applications.

## Installation

```bash
npm install @b10cks/react @b10cks/client
```

## Usage

```tsx
import { B10cksProvider, useB10cksApi } from '@b10cks/react'

function App() {
  return (
    <B10cksProvider
      apiClientOptions={{
        token: 'your-access-token',
        baseUrl: 'https://api.b10cks.com/api',
      }}
    >
      <Page />
    </B10cksProvider>
  )
}

function Page() {
  const { useContent } = useB10cksApi()
  const content = useContent('home')

  if (content.pending) return <div>Loading...</div>
  return <pre>{JSON.stringify(content.data, null, 2)}</pre>
}
```

## License

MIT
