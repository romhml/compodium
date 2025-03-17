import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    { builder: 'copy', input: '../../', pattern: 'LICENSE.md|README.md' }
  ],
  replace: {
    'process.env.DEV': 'false',
    'process.env.COMPODIUM_DEVTOOLS_URL': undefined
  }
})
