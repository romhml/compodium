import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    // Include devtools runtime files
    { input: './src/devtools/runtime', builder: 'mkdist', outDir: 'dist/devtools/runtime' },
  ],
  rollup: {
    emitCJS: true,
  },
  replace: {
    'process.env.DEV': 'false',
    'process.env.COMPODIUM_LOCAL': 'false',
  },
})
