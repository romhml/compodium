import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    { builder: 'copy', input: '../../', pattern: 'LICENSE.md|README.md' }
  ],
  declaration: true
})
