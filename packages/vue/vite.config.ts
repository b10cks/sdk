import pkg from './package.json'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vitest/config'
import path from 'node:path'
import banner from 'vite-plugin-banner'
import dts from 'vite-plugin-dts'
import chalk from 'chalk'

// eslint-disable-next-line no-console
console.log(`${chalk.green('b10cks Vue SDK')} v${pkg.version}`)

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
    vue(),
    banner({
      content: `/**\n * Name: ${pkg.name} v${pkg.version}\n * ${new Date().getFullYear()} (c) ${pkg.author}\n * Description: ${pkg.description}\n */`,
    }) as unknown as Plugin,
  ] as Plugin[],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src', 'index.ts'),
      name: 'b10cksVue',
      fileName: (format) => {
        const name = 'b10cks-vue'
        return format === 'es' ? `${name}.mjs` : `${name}.js`
      },
    },
    rollupOptions: {
      output: {
        globals: {
          vue: 'Vue',
        },
      },
      external: ['vue'],
    },
  },
  optimizeDeps: {
    exclude: ['vue'],
  }
})