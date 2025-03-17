import type { BuildConfig } from 'unbuild'

export default {
  clean: true,
  rollup: {
    esbuild: {
      target: 'esnext'
    },
    emitCJS: true,
    cjsBridge: true
  },
  declaration: true
} satisfies BuildConfig
