import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index'
  ],
  externals: [
    'typescript'
  ],
  declaration: true
})
