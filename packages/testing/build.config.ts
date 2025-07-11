import { defineBuildConfig } from 'unbuild'
import config from '../../build.config'

export default defineBuildConfig({
  ...config,
  entries: [
    'src/index',
    // TODO: This doesn't feel right comparing to @nuxt/test-utils
    { builder: 'mkdist', input: './src/e2e', outDir: './dist/e2e' },
    { builder: 'copy', input: './src/runtime', outDir: './dist/runtime' }
  ],
  replace: {
    'process.env.COMPODIUM_TEST': 'false',
    'process.env.COMPODIUM_DEVTOOLS_URL': undefined
  }
})
