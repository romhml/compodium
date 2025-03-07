import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader } from 'h3'
import { useAppConfig } from '#imports'
import type { ComponentExample, Component } from '../../../types'

export default defineEventHandler(async (event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const componentName = (event.context.params?.['component'] || '')
  const config = useAppConfig().compodium as any

  const componentsRaw = await fs.readFile(config.componentsPath, 'utf-8')
  const components = JSON.parse(componentsRaw) as Record<string, Component | ComponentExample>

  const example = components[componentName]

  if (!example?.isExample || !example.filePath) {
    throw createError({
      statusMessage: 'Example not found!',
      statusCode: 404
    })
  }

  const exampleCode = await fs.readFile(example.filePath)
  return exampleCode
})
