import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
// @ts-expect-error virtual file
import components from '#compodium/nitro/components'
// @ts-expect-error virtual file
import dirs from '#compodium/nitro/dirs'

import { createChecker } from '../../../checker'

let checker: ReturnType<typeof createChecker>

export default defineEventHandler(async (event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const componentName = (event.context.params?.['component'] || '')

  const component: NuxtComponent = components[componentName]

  if (!component || !component.filePath) {
    throw createError({
      statusMessage: 'Example not found!',
      statusCode: 404
    })
  }

  checker ??= createChecker(dirs)

  // TODO: Move this on a separate endpoint? to be triggered by HMR?
  const code = await fs.readFile(component.filePath)
  checker.updateFile(component.filePath, code.toString())

  const meta = checker.getComponentMeta(component.filePath)
  return { ...component, meta }
})
