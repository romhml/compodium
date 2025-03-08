import type { ComponentsDir } from '@nuxt/schema'
import { createUnplugin } from 'unplugin'

import { collectionsPlugin } from './plugins/collections'
import { metaPlugin } from './plugins/meta'
import { watcherPlugin } from './plugins/watcher'

export interface PluginOptions {
  rootDir: string

  componentDirs: (ComponentsDir | string)[]

  /* Whether to include default collections for third-party libraries. */
  includeLibraryCollections: boolean

  /* Customize compodium's base directory. Defaults to 'compodium/' */
  dir: string

  /* List of glob patterns to exclude components */
  exclude: string[]

  extras: {
    ui: {
      /* If true, Compodium's UI will match your Nuxt UI color theme */
      matchColors: boolean
    }
  }
}

export const CompodiumPlugin = createUnplugin<PluginOptions>((options) => {
  return [
    collectionsPlugin(options),
    metaPlugin(options),
    watcherPlugin(options)
  ]
})
