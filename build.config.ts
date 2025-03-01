import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { input: './meta/dist', name: '@compodium/meta' }
  ],
  replace: {
    'process.env.DEV': 'false',
    'process.env.COMPODIUM_LOCAL': 'false',
    'process.env.COMPODIUM_TEST': 'false'
  },
  externals: [
    'typescript'
  ]
})
