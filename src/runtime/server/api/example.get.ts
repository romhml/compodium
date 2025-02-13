import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader } from 'h3'
import type { ComponentData as NuxtComponentData } from 'nuxt-component-meta'

export default defineEventHandler(async (event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const componentName = (event.context.params?.['component'] || '')
  const appConfig = useAppConfig()
  const examples = (appConfig._compodium as any).exampleComponents as NuxtComponentData[]

  const example = examples.find(e => e.pascalName === componentName)

  if (!example || !example.filePath) {
    throw createError({
      statusMessage: 'Example not found!',
      statusCode: 404
    })
  }

  const exampleCode = await fs.readFile(example.filePath)
  return exampleCode
})
