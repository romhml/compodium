import type { BuildConfig } from 'unbuild'

export default {
  clean: true,
  rollup: {
    esbuild: {
      target: 'esnext'
    }
  },
  declaration: true
} satisfies BuildConfig
