import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index'
  ],
  copy: [
    { from: 'src/unit', to: 'dist/' }
  ]
})
