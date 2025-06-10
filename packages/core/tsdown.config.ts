import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  copy: [
    { from: './src/runtime', to: './dist/runtime' }
  ]
  // env: {
  //   COMPODIUM_TEST: 'false',
  //   COMPODIUM_DEVTOOLS_URL: undefined
  // }
})
