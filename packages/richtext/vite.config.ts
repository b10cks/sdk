import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'b10cksRichText',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: [
        '@tiptap/core',
        '@tiptap/extension-link',
        '@tiptap/extension-table',
        '@tiptap/extension-table-cell',
        '@tiptap/extension-table-header',
        '@tiptap/extension-table-row',
        '@tiptap/extension-underline',
        '@tiptap/html',
        '@tiptap/starter-kit',
      ],
      output: {
        globals: {
          '@tiptap/core': 'TiptapCore',
          '@tiptap/extension-link': 'TiptapExtensionLink',
          '@tiptap/extension-table': 'TiptapExtensionTable',
          '@tiptap/extension-table-cell': 'TiptapExtensionTableCell',
          '@tiptap/extension-table-header': 'TiptapExtensionTableHeader',
          '@tiptap/extension-table-row': 'TiptapExtensionTableRow',
          '@tiptap/extension-underline': 'TiptapExtensionUnderline',
          '@tiptap/html': 'TiptapHtml',
          '@tiptap/starter-kit': 'TiptapStarterKit',
        },
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
