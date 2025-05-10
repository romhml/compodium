import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  replace: {
    'process.env.DEV': 'false',
    'process.env.COMPODIUM_DEVTOOLS_URL': undefined
  }
})
