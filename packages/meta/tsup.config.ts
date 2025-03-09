import type { Options } from 'tsup'

export default <Options>{
  entry: ['src/*.cts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  cjsInterop: true,
  splitting: true
}
