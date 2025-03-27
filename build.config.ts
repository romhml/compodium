import type { BuildConfig } from 'unbuild'

export default {
  clean: false,
  rollup: {
    esbuild: {
      target: 'esnext'
    },
    emitCJS: true,
    cjsBridge: true
  },
  declaration: true
} satisfies BuildConfig
