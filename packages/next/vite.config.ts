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
      // Keep `@b10cks/*` imports as package imports, not paths into their sources.
      pathsToAliases: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server.ts'),
        client: resolve(__dirname, 'src/client.ts'),
        middleware: resolve(__dirname, 'src/middleware.ts'),
        image: resolve(__dirname, 'src/image.tsx'),
      },
      name: 'b10cksNext',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'next',
        'next/image',
        'next/navigation',
        'next/server',
        'react',
        'react-dom',
        '@b10cks/client',
        '@b10cks/react',
        '@b10cks/richtext',
      ],
      output: {
        sourcemapExcludeSources: true,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@b10cks/client': 'b10cksClient',
          '@b10cks/react': 'b10cksReact',
          '@b10cks/richtext': 'b10cksRichtext',
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
