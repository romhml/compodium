import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    'src/index'
  ],
  copy: [
    { from: 'src/unit', to: 'dist/' }
  ]
})
