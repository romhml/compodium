import { inject } from 'vitest'
import { defineAsyncComponent, type Component as VueComponent } from 'vue'
import type { ComponentCollection, Component, ComponentExample, PluginConfig, CompodiumMeta } from './types'

declare module 'vitest' {
  interface ProvidedContext {
    'compodium.collections': ComponentCollection[]
    'compodium.config': PluginConfig
    'compodium.root': string
  }
}

const collections = inject('compodium.collections')

export type TestFunction = (context: {
  component: VueComponent
  meta: CompodiumMeta
} & (ComponentExample | Component)) => void | Promise<void>

export async function forEachComponents(fn: TestFunction) {
  await Promise.all(collections?.map(async (col) => {
    // TODO: Wrap component if wrapper component is defined
    const WrapperComponent = col.wrapperComponent && defineAsyncComponent(() => import(/* @vite-ignore */ col.wrapperComponent as string).then(c => c.default))

    return await Promise.all(col.components.map(async (comp) => {
      return await Promise.all([comp, ...comp.examples ?? []].map(async (example) => {
        const meta = await import(
          /* @vite-ignore */
          `/compodium:meta?component=${encodeURIComponent(example.filePath)}`
        ).then(c => c.default)

        const component = await import(/* @vite-ignore */ example.filePath).then(c => c.default)
        return await fn({ ...example, component, meta })
      }))
    }))
  }))
}
