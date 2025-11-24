# @b10cks/vue

A Vue 3 plugin and component library for seamlessly integrating b10cks CMS content into your Vue applications. Includes interactive live editing support when in preview mode.

## Features

- **Vue 3 Plugin**: Simple one-line integration
- **Dynamic Component Rendering**: Automatically render content blocks using custom components
- **Live Editing Support**: Enable in-preview mode editing with real-time updates
- **Type-Safe**: Full TypeScript support
- **Zero Runtime Dependencies**: Lightweight and efficient
- **Directive-Based Editing**: Simple v-directives for marking editable regions
- **Preview Bridge**: Seamless communication with b10cks preview environment

## Installation

```bash
npm install @b10cks/vue @b10cks/client vue
# or
pnpm add @b10cks/vue @b10cks/client vue
# or
yarn add @b10cks/vue @b10cks/client vue
```

## Quick Start

### 1. Register the Plugin

```typescript
import { createApp } from 'vue'
import { B10cksVue } from '@b10cks/vue'
import App from './App.vue'

const app = createApp(App)

app.use(B10cksVue, {
  // Plugin options (optional)
})

app.mount('#app')
```

### 2. Use in Your Components

```vue
<template>
  <div v-editable="block">
    <B10cksComponent :block="block" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { B10cksComponent } from '@b10cks/vue'
import type { IBContent } from '@b10cks/client'

const block = ref<IBContent>({
  id: '123',
  slug: 'hero',
  name: 'Hero Block',
  content: {},
  type: 'hero',
  parent_id: null,
  full_slug: 'hero',
  language_iso: 'en',
  published_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})
</script>
```

## Components

### B10cksComponent

Dynamically renders content blocks based on their type, using a naming convention to map block types to component names.

**Props:**
- `block` (IBContent, required): The content block to render

**Component Resolution:**
The component automatically converts block types to PascalCase and imports from `~/b10cks/{ComponentName}.vue`:
- Block type `hero_section` → imports `HeroSection.vue`
- Block type `cta_button` → imports `CtaButton.vue`

**Example:**

```vue
<template>
  <B10cksComponent :block="content" />
</template>

<script setup lang="ts">
import { B10cksComponent } from '@b10cks/vue'
import type { IBContent } from '@b10cks/client'

const content: IBContent = {
  // ... content data
  block: 'hero_section',
}
</script>
```

Create your block components in `~/b10cks/` directory:

```vue
<!-- ~/b10cks/HeroSection.vue -->
<template>
  <section class="hero">
    <h1>{{ block.content.title }}</h1>
    <p>{{ block.content.subtitle }}</p>
  </section>
</template>

<script setup lang="ts">
import type { IBContent } from '@b10cks/client'

defineProps<{
  block: IBContent
}>()
</script>
```

## Directives

### v-editable

Mark content blocks as editable in preview mode. When in the b10cks editor preview, clicking an element with this directive will select it for editing.

```vue
<template>
  <div v-editable="block" class="content-block">
    <!-- Block content -->
  </div>
</template>
```

**Behavior:**
- Adds `b10cks-preview` class in preview mode
- Adds `b10cks-selected` class when the item is selected
- Adds `b10cks-hover` class when hovering
- Updates content in real-time when edited in the preview panel

**Default Styling (when in preview):**

```css
.b10cks-hover,
.b10cks-preview:hover {
  outline: 2px dashed rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}

.b10cks-selected {
  outline: 2px solid rgb(59, 130, 246) !important;
  outline-offset: 2px;
}
```

### v-editable-field

Mark individual fields within a content block as editable.

```vue
<template>
  <div v-editable="block">
    <h1 v-editable-field="{ id: block.id, field: 'title' }">
      {{ block.content.title }}
    </h1>
  </div>
</template>
```

## Live Editing

### Preview Bridge

The `previewBridge` utility handles communication with the b10cks editor preview environment. It's automatically initialized when the plugin is loaded.

```typescript
import { previewBridge } from '@b10cks/vue'

// Check if in preview mode
if (previewBridge.isInPreviewMode()) {
  console.log('Currently in editor preview mode')
}

// Listen for content updates
previewBridge.on('CONTENT_UPDATE', ({ content }) => {
  console.log('Content was updated:', content)
})

// Programmatically select an item for editing
previewBridge.selectItem('block-id-123')
```

### Events

The preview bridge emits these events:

- `SELECT_UPDATE`: When an item is selected for editing
- `HOVER_UPDATE`: When an item is hovered
- `CONTENT_UPDATE`: When an item's content is updated

## Advanced Usage

### Custom Block Component Imports

To customize how block components are imported, extend the B10cksComponent:

```vue
<template>
  <component
    :is="resolvedComponent"
    v-if="resolvedComponent"
    v-bind="{ block, ...rest }"
  />
  <div v-else>Component not found: {{ block.block }}</div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, computed, watch, shallowRef } from 'vue'
import type { IBContent } from '@b10cks/client'

const props = defineProps<{
  block: IBContent
}>()

const resolvedComponent = shallowRef(null)

watch(
  () => props.block.block,
  async (blockType) => {
    try {
      // Your custom import logic here
      resolvedComponent.value = defineAsyncComponent({
        loader: () => import(`./blocks/${blockType}.vue`),
      })
    } catch (error) {
      console.error(`Failed to load block: ${blockType}`, error)
    }
  },
  { immediate: true }
)
</script>
```

### Handling Preview Mode Differently

```vue
<template>
  <div>
    <div v-if="isPreviewMode" class="edit-notice">
      You are in edit mode
    </div>
    <B10cksComponent :block="content" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { previewBridge } from '@b10cks/vue'

const isPreviewMode = computed(() => previewBridge.isInPreviewMode())
</script>
```

## Type Definitions

All types are re-exported from `@b10cks/client`:

```typescript
import type {
  IBContent,
  IBBlock,
  IBResponse,
  IBCollectionResponse,
  IBDataSource,
  IBDataEntry,
  IBSpace,
} from '@b10cks/vue'
```

## Styling

The v-editable directive automatically applies CSS classes but doesn't force any styles. You can customize the appearance in your CSS:

```css
.b10cks-preview {
  cursor: pointer;
}

.b10cks-preview:hover {
  background: rgba(59, 130, 246, 0.1);
}

.b10cks-selected {
  background: rgba(59, 130, 246, 0.2) !important;
}
```

## Browser Support

Requires Vue 3.5+ and modern browsers with:
- ES2020+ support
- Promise support
- Dynamic import() support

## License

MIT
