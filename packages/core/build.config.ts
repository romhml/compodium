import { defineBuildConfig } from 'unbuild'
import config from '../../build.config'

export default defineBuildConfig({
  ...config,
  entries: [
    'src/index',
    { builder: 'copy', input: './src/runtime', outDir: './dist/runtime' },
    { builder: 'copy', input: '../../', pattern: 'LICENSE.md|README.md' }
  ]
})
