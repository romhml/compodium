import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    { builder: 'copy', input: '../../', pattern: 'LICENSE.md' },
    { builder: 'copy', input: 'src/examples', outDir: 'dist/examples' }

  ],
  declaration: true
})
