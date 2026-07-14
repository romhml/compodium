import type { ComponentCollection, CompodiumHooks, CompodiumMeta, PluginOptions } from '@compodium/core'
import { createHooks } from 'hookable'
import { createSharedComposable } from '@vueuse/core'

function _useCompodiumClient() {
  const hooks = createHooks<CompodiumHooks>()
  let collectionsRevision = 0
  let metaRevision = 0
  let exampleRevision = 0
  let colorsRevision = 0
  window.__COMPODIUM_HOOKS__ = hooks

  async function loadCollections(): Promise<ComponentCollection[]> {
    collectionsRevision = Math.max(Date.now(), collectionsRevision + 1)
    const url = `/__compodium__/modules/collections?t=${collectionsRevision}`
    const collectionsModule = await import(/* @vite-ignore */ url) as { default?: unknown }

    if (!Array.isArray(collectionsModule.default)) {
      throw new TypeError('Compodium collections module must have an array as its default export')
    }

    return collectionsModule.default as ComponentCollection[]
  }

  async function loadMeta(componentPath: string, macroPath?: string): Promise<CompodiumMeta> {
    metaRevision = Math.max(Date.now(), metaRevision + 1)
    const macroQuery = macroPath ? `&macro=${encodeURIComponent(macroPath)}` : ''
    const url = `/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}${macroQuery}&t=${metaRevision}`
    const metaModule = await import(/* @vite-ignore */ url) as { default?: unknown }

    if (!metaModule.default || typeof metaModule.default !== 'object' || Array.isArray(metaModule.default)) {
      throw new TypeError('Compodium metadata module must have an object as its default export')
    }

    return metaModule.default as CompodiumMeta
  }

  async function loadExampleSource(filePath: string): Promise<string> {
    exampleRevision = Math.max(Date.now(), exampleRevision + 1)
    const url = `/__compodium__/modules/example?path=${encodeURIComponent(filePath)}&t=${exampleRevision}`
    const exampleModule = await import(/* @vite-ignore */ url) as { default?: unknown }

    if (typeof exampleModule.default !== 'string') {
      throw new TypeError('Compodium example module must have a string as its default export')
    }

    return exampleModule.default
  }

  async function loadColors(): Promise<NonNullable<PluginOptions['extras']>['colors']> {
    colorsRevision = Math.max(Date.now(), colorsRevision + 1)
    const url = `/__compodium__/modules/colors?t=${colorsRevision}`
    const colorsModule = await import(/* @vite-ignore */ url) as { default?: unknown }

    if (colorsModule.default !== undefined && (!colorsModule.default || typeof colorsModule.default !== 'object' || Array.isArray(colorsModule.default))) {
      throw new TypeError('Compodium colors module must have an object as its default export')
    }

    return colorsModule.default as NonNullable<PluginOptions['extras']>['colors']
  }

  return {
    hooks,
    loadCollections,
    loadMeta,
    loadExampleSource,
    loadColors
  }
}

export const useCompodiumClient = createSharedComposable(_useCompodiumClient)
