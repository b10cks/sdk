# b10cks SDK

Official JavaScript/TypeScript SDKs for [b10cks](https://b10cks.com) – a modern headless CMS and content management platform.

This monorepo contains multiple packages that enable seamless integration of b10cks into your web applications.

## 📦 Packages

### [@b10cks/client](./packages/client)

**Core API client** for communicating with the b10cks API.

- Type-safe HTTP client
- Automatic pagination handling
- Revision and version tracking
- Works in browsers and Node.js

```bash
npm install @b10cks/client
```

### [@b10cks/vue](./packages/vue)

**Vue 3 integration** for building interactive content management experiences.

- Vue 3 plugin with global directives
- Editable content directives (`v-editable`, `v-editable-field`)
- Reusable component system
- Preview bridge support

```bash
npm install @b10cks/vue @b10cks/client
```

### [@b10cks/nuxt](./packages/nuxt)

**Nuxt 4 module** for zero-config integration with Nuxt applications.

- Auto-configured b10cks integration
- Global component registration
- Runtime configuration
- Built on top of `@b10cks/vue`

```bash
npm install @b10cks/nuxt
```

## 🚀 Quick Start

### For Nuxt Projects

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ["@b10cks/nuxt"],
  b10cks: {
    accessToken: "your-access-token",
    apiUrl: "https://api.b10cks.com/api",
  },
});
```

### For Vue Projects

```typescript
import { createApp } from "vue";
import { B10cksVue } from "@b10cks/vue";

const app = createApp(App);

app.use(B10cksVue, {
  accessToken: "your-access-token",
  apiUrl: "https://api.b10cks.com/api",
});

app.mount("#app");
```

### For Direct API Access

```typescript
import { ApiClient } from "@b10cks/client";

const client = new ApiClient(
  {
    baseUrl: "https://api.b10cks.com/api",
    token: "your-access-token",
    fetchClient: fetch,
  },
  new URL(window.location.href),
);

const blocks = await client.get("blocks");
```

## 📖 Documentation

- [b10cks Documentation](https://docs.b10cks.com/)
- Individual package READMEs:
  - [Client Package](./packages/client/README.md)
  - [Vue Package](./packages/vue/README.md)
  - [Nuxt Package](./packages/nuxt/README.md)

## 🛠️ Development

### Prerequisites

- Node.js 24.7.0 or higher
- pnpm 10.15.1 or higher

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test

# Lint and fix code
pnpm run lint:fix
```

### Project Structure

```
sdk/
├── packages/
│   ├── client/       # Core API client
│   ├── vue/          # Vue 3 plugin
│   └── nuxt/         # Nuxt module
├── scripts/          # Build and utility scripts
└── .changeset/       # Changesets for versioning
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Making code changes
- Writing tests
- Submitting pull requests

## 📋 License

MIT – see [LICENSE](./LICENSE) for details

## 💬 Support & Community

- **Discord**: [Join our community](https://discord.gg/coders_cantina)
- **Issues**: [GitHub Issues](https://github.com/b10cks/sdk/issues)

## 🔗 Links

- [b10cks Website](https://discord.gg/KYWFsctk)
- [GitHub Repository](https://github.com/b10cks/sdk)
- [npm Organization](https://www.npmjs.com/org/b10cks)

---

Made with ❤️ in Austria by [Coder's Cantina](https://www.coderscantina.com)
