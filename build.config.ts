import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  // TODO: Remove
  failOnWarn: false,

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
