import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    { builder: 'copy', input: './src/runtime', outDir: './dist/runtime' },
    { builder: 'copy', input: '../../', pattern: 'LICENSE.md|README.md' }
  ],
  externals: [
    'vue'
  ],
  declaration: true
})
