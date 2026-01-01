import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index'
  ],
  dts: true,
  copy: [
    { from: 'src/examples', to: 'dist/' },
    { from: 'src/assets', to: 'dist/' }
  ]
})
