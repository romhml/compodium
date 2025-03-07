export default defineNuxtConfig({
  modules: ['../../../src/module'],
  components: [
    { path: 'components/' },
    { path: 'my-ui/', prefix: 'U' }
  ]
})
