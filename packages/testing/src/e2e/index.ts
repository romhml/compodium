// import { describe, beforeEach, afterEach } from 'vitest'
// import type { CompodiumHooks, ComponentCollection, CompodiumMeta, Component } from '@compodium/core'
// import type { Hookable } from 'hookable'
// import { page } from '@vitest/browser/context'
//
// export { page }
//
// const collections = await import('virtual:compodium/collections').then(c => c.default) as ComponentCollection[]
//
// const componentMap = collections.flatMap(col => col.components?.flatMap(comp => [comp, ...(comp.examples ?? [])])).reduce((acc, c) => {
//   if (c.componentName) acc[c.componentName] = c
//   acc[c.pascalName] = c
//
//   return acc
// }, {} as Record<string, Component>)
//
// const hooks = window.__COMPODIUM_HOOKS__ as Hookable<CompodiumHooks>
//
// export type CompodiumTestFunction = (ctx: {
//   component: Component
//   meta: CompodiumMeta
//   collection: ComponentCollection
// }) => void | Promise<void>
//
// export function describeComponent(componentName: string, fn: CompodiumTestFunction) {
//   const component = componentMap[componentName]
//   if (!component) throw new Error(`[Compodium] Component not found ${componentName}`)
//
//   const collection = collections.find(c => c.name === component?.collectionName) as ComponentCollection
//
//   return describe(collection.name, async () => {
//     describe(componentName, async () => {
//       const meta = await fetch(`/__compodium__/api/meta?component=${component.filePath}`).then(async r => (await r.json()) as CompodiumMeta)
//
//       beforeEach(async () => {
//         await hooks?.callHook('renderer:update-component', {
//           path: component.filePath,
//           props: meta.compodium?.defaultProps,
//           wrapper: collection.wrapperComponent,
//           events: meta.events
//         })
//       })
//
//       afterEach(({ task }) => {
//         task.meta.compodium ??= {}
//         task.meta.compodium.screenshotPath = task.annotations.find(a => a.message === 'Actual screenshot')?.attachment?.path
//         task.meta.compodium.stagedScreenshotPath = task.annotations.find(a => a.message === 'Reference screenshot')?.attachment?.path
//         task.meta.compodium.diff = !!task.meta.compodium.stagedScreenshotPath
//         task.meta.compodium.diffPath = task.annotations.find(a => a.message === 'Diff')?.attachment?.path
//       })
//
//       await fn({ collection, component, meta })
//     })
//   })
// }
