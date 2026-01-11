// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    tsConfig: {
      compilerOptions: {
        paths: {
          '@b10cks/client': ['../client/src'],
          '@b10cks/vue': ['../vue/src'],
          '@b10cks/nuxt': ['../nuxt/src'],
        },
      },
    },
  },
})
