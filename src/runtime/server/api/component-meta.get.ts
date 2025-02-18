import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader, getRouterParam } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
import { useAppConfig } from '#imports'
import { camelCase } from 'scule'
import { getChecker } from '../services/checker'
import micromatch from 'micromatch'
import type { Collection } from '../../../types'
import { inferPropTypes } from '../services/infer'

export default defineEventHandler(async (event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const config = useAppConfig().compodium as any

  const componentsRaw = await fs.readFile(config.componentsPath, 'utf-8')
  const components = JSON.parse(componentsRaw)
  const componentName = getRouterParam(event, 'component')
  const component: NuxtComponent = componentName && components[componentName]

  const collections = config.collections as Collection[]
  const defaultComponentProps = config.defaultProps

  if (!component || !component.filePath) {
    throw createError({
      statusMessage: 'Component not found!',
      statusCode: 404
    })
  }

  const checker = getChecker()
  checker.reload()

  const meta = checker.getComponentMeta(component.filePath)

  // Look for default prop values.
  let defaultProps = {}

  const collection = collections.find((c) => {
    if (!c.external && component.filePath?.match('node_modules/')) return false
    return micromatch.isMatch(component.filePath, [
      `${c.path}`
    ], { ignore: c.ignore, contains: true })
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
      defaultProps = defaultComponentProps?.[collection.id]?.[componentId] || {}
    } else {
      const collectionNameCamelCase = camelCase(collection.name)
      defaultProps = defaultComponentProps?.[collectionNameCamelCase]?.[componentId] || {}
    }
  }

  const parsed = meta.props.map(inferPropTypes)

  return {
    ...component,
    meta: {
      props: parsed
    },
    defaultProps
  }
})
