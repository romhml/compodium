import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
import { useAppConfig } from '#imports'
import { camelCase } from 'scule'
// @ts-expect-error virtual file
import components from '#compodium/nitro/components'
import { getChecker } from '../services/checker'

export default defineEventHandler(async (event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const componentName = (event.context.params?.['component'] || '')
  const component: NuxtComponent = components[componentName]

  // TODO: put default props into the component meta.
  // identify components using camelCase. Also should handle nuxt ui defaults
  const collections = useAppConfig().compodium.collections
  const defaultComponentProps = useAppConfig().compodium.defaultProps

  if (!component || !component.filePath) {
    throw createError({
      statusMessage: 'Component not found!',
      statusCode: 404
    })
  }

  const checker = getChecker()

  // TODO: Move this on a separate endpoint? to be triggered by HMR?
  const code = await fs.readFile(component.filePath)
  checker.updateFile(component.filePath, code.toString())

  const meta = checker.getComponentMeta(component.filePath)

  // Look for default prop values.
  let defaultProps = {}
  const collection = collections.find((c) => {
    if (!c.external && component.filePath?.match('node_modules/')) return false
    return component.filePath?.match(c.match)
  })

  if (collection) {
    // Convert pascalName to camelCase
    let componentId = camelCase(component.pascalName)
    // Remove the prefix if it exists
    if (collection.prefix) {
      componentId = camelCase(componentId.replace(new RegExp(`^${camelCase(collection.prefix)}`), ''))
    }

    // Retrieve default props based on collection type
    if (collection.external) {
      defaultProps = defaultComponentProps[collection.id]?.[componentId] || {}
    } else {
      const collectionNameCamelCase = camelCase(collection.name)
      defaultProps = defaultComponentProps[collectionNameCamelCase]?.[componentId] || {}
    }
  }

  return { ...component, meta, defaultProps }
})
