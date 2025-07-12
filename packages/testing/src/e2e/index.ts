import { describe, beforeEach, expect, inject } from 'vitest'
import type { TestContext } from 'vitest'
import type { CompodiumHooks, ComponentCollection, CompodiumMeta, Component } from '@compodium/core'
import type { Hookable } from 'hookable'
import { page, commands, server } from '@vitest/browser/context'
import type { Locator } from '@vitest/browser/context'
import { joinURL } from 'ufo'
import resemble from 'resemblejs'

export { page }

const collections = await fetch('/__compodium__/api/collections').then(async r => (await r.json()) as ComponentCollection[])

const componentMap = collections.flatMap(col => col.components?.flatMap(comp => [comp, ...(comp.examples ?? [])])).reduce((acc, c) => {
  acc[c.pascalName] = c
  return acc
}, {} as Record<string, Component>)

const hooks = window.__COMPODIUM_HOOKS__ as Hookable<CompodiumHooks>

export type CompodiumTestFunction = (ctx: {
  component: Component
  meta: CompodiumMeta
  collection: ComponentCollection
}) => void | Promise<void>

export function describeComponent(componentName: string, fn: CompodiumTestFunction) {
  const component = componentMap[componentName]
  const collection = collections.find(c => c.name === component.collectionName) as ComponentCollection

  if (!component) throw new Error(`[Compodium] Component not found ${componentName}`)

  return describe(collection.name, async () => {
    describe(componentName, async () => {
      const meta = await fetch(`/__compodium__/api/meta?component=${component.filePath}`).then(async r => (await r.json()) as CompodiumMeta)

      beforeEach(async () => {
        await hooks?.callHook('renderer:update-component', {
          path: component.filePath,
          props: meta.compodium?.defaultProps,
          wrapper: collection.wrapperComponent,
          events: meta.events
        })
      })

      await fn({ collection, component, meta })
    })
  })
}

const dir = inject('compodium.dir')

declare module 'vitest' {
  interface Matchers<T = any> {
    toMatchScreenshot(expected: string, context: TestContext): Promise<T>
  }
}

expect.extend({
  async toMatchScreenshot(element: Locator, name: string, context: TestContext) {
    const screenshotPath = joinURL(dir, `./__screenshots__/${name}`)
    const stagedPath = joinURL(dir, `./__screenshots__/staged/${name}`)

    const updateSnapshots = server.config.snapshotOptions?.updateSnapshot === 'all'

    const meta = context.task.meta.compodium ??= {}

    meta.screenshotPath = screenshotPath
    meta.stagedScreenshotPath = stagedPath

    const { base64: screenshot } = await page.screenshot({ path: screenshotPath, save: true, base64: true, element })
    const staged = await commands.readFile(stagedPath, { encoding: 'base64' }).catch(_ => null)

    if (staged && !updateSnapshots) {
      const diff: resemble.ComparisonResult = await new Promise(resolve => resemble(`data:image/png;base64,${staged}`).compareTo(`data:image/png;base64,${screenshot}`).onComplete(data => resolve(data)))

      if (diff.error) {
        throw new Error(`[Compodium] Error while comparing screenshots:\n ${diff.error.toString()}`)
      }

      if (diff.rawMisMatchPercentage > 0.001) {
        context.task.meta.compodium ??= {}
        context.task.meta.compodium.diff = true

        return {
          pass: false,
          message: () => `Screenshot comparison failed.
Difference: ${diff.rawMisMatchPercentage.toFixed(3)}`
        }
      }
    }

    await commands.writeFile(stagedPath, screenshot, { encoding: 'base64' })

    return {
      pass: true,
      message: () => ''
    }
  }
})
