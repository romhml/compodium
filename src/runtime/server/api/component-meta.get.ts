import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader, getRouterParam } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
import { useAppConfig } from '#imports'
import { camelCase } from 'scule'
import { getChecker } from '../services/checker'
import type { Collection } from '../../../types'
import { inferPropTypes } from '../services/infer'
import { getComponentCollection } from '../../utils'

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

  let defaultProps = {}

  const collection = getComponentCollection(component, collections)
  if (collection) {
    let componentId = camelCase(component.pascalName)
    if (collection.prefix) {
      componentId = camelCase(componentId.replace(new RegExp(`^${camelCase(collection.prefix)}`), ''))
    }

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
