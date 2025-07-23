import pkg from './package.json'
import banner from 'vite-plugin-banner'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import chalk from 'chalk'
import path from 'node:path'

// eslint-disable-next-line no-console
console.log(`${chalk.green('b10cks API client')} v${pkg.version}`)

export default defineConfig(() => ({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
    }),
    banner({
      content: `/**\n * Name: ${pkg.name} v${pkg.version}\n * ${new Date().getFullYear()} (c) ${pkg.author}\n * Description: ${pkg.description}\n */`,    }),
  ],

  build: {
    lib: {
      entry: path.resolve(__dirname, 'src', 'index.ts'),
      name: 'b10cksClient',
      fileName: (format) => {
        const name = 'b10cks-client'
        return format === 'es' ? `${name}.mjs` : `${name}.js`
      },
    }
  }
}))