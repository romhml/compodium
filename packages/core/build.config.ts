import { defineBuildConfig } from 'unbuild'
import config from '../../build.config'

export default defineBuildConfig({
  ...config,
  entries: [
    'src/index',
    { builder: 'copy', input: './src/runtime', outDir: './dist/runtime' }
  ],
  replace: {
    'process.env.COMPODIUM_TEST': 'false',
    'process.env.COMPODIUM_DEVTOOLS_URL': undefined
  }
})
