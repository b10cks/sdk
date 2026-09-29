import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      bundleTypes: false,
      outDir: 'dist',
      entryRoot: 'src',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        // Tiptap-based preview editor, loaded on demand in preview mode only.
        editor: resolve(__dirname, 'src/editor/index.ts'),
      },
      name: 'b10cksRichText',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [/^@tiptap\//],
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
})
