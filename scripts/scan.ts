import { scanComponents } from '../packages/core/src/plugins/utils'
import { createChecker } from '../packages/core/src/plugins/meta/checker'
import { consola } from 'consola'
import { defineCommand, runMain } from 'citty'

const main = defineCommand({
  meta: {
    name: 'Compodium',
    description: 'Compodium CLI'
  },
  args: {
    path: {
      type: 'positional',
      required: true
    },
    ignore: {
      required: false,
      type: 'string'
    },
    pathPrefix: {
      required: false,
      type: 'boolean',
      default: false
    }
  },
  async run({ args }) {
    const ignore = Array.isArray(args.ignore) ? args.ignore as string[] : args.ignore ? [args.ignore] : undefined

    const dirs = [
      {
        path: args.path,
        pattern: '**/*.{vue,tsx,js,mjs}',
        ignore,
        pathPrefix: args.pathPrefix
      }
    ]
    const components = await scanComponents(dirs, '../')

    const output = components.map(c => c.pascalName).join('\n')

    console.log(output)
  }
})

runMain(main)
