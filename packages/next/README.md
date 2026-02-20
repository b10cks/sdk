# @b10cks/next

Next.js integration for b10cks built on top of `@b10cks/react`.

## Installation

```bash
npm install @b10cks/next @b10cks/react @b10cks/client
```

## Configure Next.js

```ts
// next.config.ts
import { withB10cks } from '@b10cks/next'

export default withB10cks({
  reactStrictMode: true,
})
```

## Client Usage

```tsx
'use client'

import { B10cksNextProvider, useB10cksApi } from '@b10cks/next/client'

export function App({ children }: { children: React.ReactNode }) {
  return (
    <B10cksNextProvider
      apiClientOptions={{
        token: process.env.NEXT_PUBLIC_B10CKS_TOKEN || '',
        baseUrl: 'https://api.b10cks.com/api',
      }}
    >
      {children}
    </B10cksNextProvider>
  )
}
```

## Server Usage

```ts
import { createB10cksNextApi } from '@b10cks/next/server'

const { dataApi } = createB10cksNextApi({
  token: process.env.B10CKS_TOKEN || '',
  baseUrl: 'https://api.b10cks.com/api',
  fetchClient: fetch,
})
```

## License

MIT
