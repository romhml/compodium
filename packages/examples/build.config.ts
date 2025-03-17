import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    { builder: 'copy', input: '../../', pattern: 'LICENSE.md' },
    { builder: 'copy', input: 'src/examples', outDir: 'dist/examples' },
    { builder: 'copy', input: 'src/assets', outDir: 'dist/assets' }
  ],
  declaration: true
})
