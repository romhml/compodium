import { defineConfig } from 'tsdown'

export default defineConfig({
  clean: true,
  dts: true,
  entry: [
    'src/index'
  ],
  external: ['typescript', 'vite', 'vue', '@compodium/core', '@vue/devtools-kit']
})
