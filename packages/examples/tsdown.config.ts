import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/index.ts',
  copy: [
    { from: 'src/examples', to: 'dist/examples' },
    { from: 'src/assets', to: 'dist/assets' }
  ]
})
