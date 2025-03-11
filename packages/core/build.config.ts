import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
    {
      builder: 'mkdist',
      input: './src/runtime',
      distDir: './dist/runtime'
    }
  ],
  externals: [
    'vue'
  ],
  declaration: true
})
