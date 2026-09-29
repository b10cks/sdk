import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      bundleTypes: true,
      // Keep `@b10cks/richtext` imports as package imports, not paths into its sources.
      pathsToAliases: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'b10cksClient',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      // The rich text editor stays a dynamic import, so consumer bundles split it off.
      external: ['@b10cks/richtext', '@b10cks/richtext/editor'],
      output: {
        sourcemapExcludeSources: true,
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    alias: {
      '@b10cks/richtext/editor': resolve(__dirname, '../richtext/src/editor/index.ts'),
      '@b10cks/richtext': resolve(__dirname, '../richtext/src/index.ts'),
    },
  },
})
