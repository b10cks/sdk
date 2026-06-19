import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  rollup: {
    inlineDependencies: true,
    resolve: {
      exportConditions: ['production', 'node'] as any,
    },
  },
  entries: ['src/index'],
  externals: [
    'fsevents',
    'node:url',
    'node:buffer',
    'node:path',
    'node:child_process',
    'node:process',
    'node:os',
    'node:fs',
  ],
  replace: {
    'process.env.B10CKS_API_DOMAIN': JSON.stringify(
      process.env.B10CKS_API_DOMAIN || 'https://api.b10cks.com'
    ),
  },
})
