import { joinURL } from 'ufo'
import AST from 'unplugin-ast/vite'
import { RemoveWrapperFunction } from 'unplugin-ast/transformers'

import { libraryCollections as libraryCollectionsConfig } from '@compodium/examples'
import { collectionsPlugin } from './plugins/collections'
import { metaPlugin } from './plugins/meta'
import { examplePlugin } from './plugins/examples'
import { devtoolsPlugin } from './plugins/devtools'
import { colorsPlugin } from './plugins/colors'
import { iconifyPlugin } from './plugins/iconify'

import type { Collection, PluginConfig, PluginOptions } from './types'

export * from './types'

export const compodium = /* #__PURE__ */ (options: PluginOptions) => {
  const exampleDir = {
    path: joinURL(options.rootDir, options.dir, 'examples'),
    pattern: '**/*.{vue,tsx}'
  }

  const componentDirs = options?.componentDirs.map((dir) => {
    const componentDir = typeof dir === 'string' ? { path: dir } : dir
    return {
      pattern: '**/*.{vue,tsx}',
      ...componentDir,
      ignore: (componentDir.ignore ?? []).concat(options.ignore ?? [])
    }
  }).filter(collection => !collection.path?.includes('node_modules/'))

  const componentCollection: Collection = {
    name: 'Components',
    exampleDir,
    dirs: componentDirs
  }

  const libraryCollections = options.includeLibraryCollections
    ? libraryCollectionsConfig.map(collection => ({
        ...collection,
        exampleDir: {
          path: collection.exampleDir,
          pattern: '**/*.{vue,tsx}'
        },
        dirs: [{
          path: collection.path,
          pattern: '**/*.{vue,tsx}',
          ignore: collection.ignore
        }]
      }))
    : []

  const config: PluginConfig = {
    ...options,
    libraryCollections,
    componentCollection
  }

  return [
    collectionsPlugin(config),
    metaPlugin(config),
    devtoolsPlugin(config),
    examplePlugin(config),
    iconifyPlugin(config),
    colorsPlugin(config),
    AST({
      include: [/\.[jt]sx?$/, /\.vue$/],
      transformer: [RemoveWrapperFunction(['extendCompodiumMeta'])]
    })
  ]
}
