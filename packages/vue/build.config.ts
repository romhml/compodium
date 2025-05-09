import { defineBuildConfig } from 'unbuild'
import config from '../../build.config'

export default defineBuildConfig({
  ...config,
  entries: [
    'src/index'
  ],
  externals: ['typescript']
})
