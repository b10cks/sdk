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
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli.ts'),
      },
      name: 'b10cksMcpServer',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'js'}`,
    },
    rollupOptions: {
      external: (id) =>
        id === '@b10cks/mgmt-client' ||
        id.startsWith('@modelcontextprotocol/sdk') ||
        id.startsWith('node:'),
      output: {
        banner: '#!/usr/bin/env node',
        globals: {},
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
})
