import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
import { useAppConfig } from '#imports'

export default defineEventHandler(async (event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const componentName = (event.context.params?.['component'] || '')
  const appConfig = useAppConfig()
  const examples = (appConfig.compodium as any).exampleComponents as NuxtComponent[]

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
