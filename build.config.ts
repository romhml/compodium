import type { BuildConfig } from 'unbuild'

export default {
  clean: false,
  rollup: {
    esbuild: {
      target: 'esnext'
    }
  },
  declaration: true
} satisfies BuildConfig
