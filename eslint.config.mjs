import js from '@eslint/js';
import ts from 'typescript-eslint';
import vue from 'eslint-plugin-vue';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.nuxt/**',
      '**/*.d.ts',
      'pnpm-lock.yaml',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vue.parsers['vue-eslint-parser'],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: ts.parser,
      },
    },
    plugins: {
      vue,
    },
    rules: {
      ...vue.configs.base.rules,
      ...vue.configs['vue3-essential'].rules,
      ...vue.configs['vue3-recommended'].rules,
      'vue/multi-word-component-names': 'off',
      'vue/no-setup-props-destructure': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-types': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
];
