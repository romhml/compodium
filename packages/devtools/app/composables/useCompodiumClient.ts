import type { ComponentCollection, CompodiumHooks, CompodiumMeta, PluginOptions } from '@compodium/core'
import { createHooks } from 'hookable'
import { createSharedComposable } from '@vueuse/core'

function _useCompodiumClient() {
  const hooks = createHooks<CompodiumHooks>()
  let revision = 0
  window.__COMPODIUM_HOOKS__ = hooks

  async function loadModule<T>(url: string): Promise<T> {
    revision = Math.max(Date.now(), revision + 1)
    const separator = url.includes('?') ? '&' : '?'
    const mod = await import(/* @vite-ignore */ `${url}${separator}t=${revision}`) as { default: T }
    return mod.default
  }

  function loadCollections(): Promise<ComponentCollection[]> {
    return loadModule<ComponentCollection[]>('/__compodium__/modules/collections')
  }

  function loadMeta(componentPath: string, macroPath?: string): Promise<CompodiumMeta> {
    const macroQuery = macroPath ? `&macro=${encodeURIComponent(macroPath)}` : ''
    return loadModule<CompodiumMeta>(`/__compodium__/modules/meta?component=${encodeURIComponent(componentPath)}${macroQuery}`)
  }

  function loadExampleSource(filePath: string): Promise<string> {
    return loadModule<string>(`/__compodium__/modules/example?path=${encodeURIComponent(filePath)}`)
  }

  function loadColors(): Promise<NonNullable<PluginOptions['extras']>['colors']> {
    return loadModule<NonNullable<PluginOptions['extras']>['colors']>('/__compodium__/modules/colors')
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
