import fs from 'node:fs/promises'
import { defineEventHandler, createError, appendHeader, getRouterParam } from 'h3'
import type { Component as NuxtComponent } from '@nuxt/schema'
import { useAppConfig } from '#imports'
import { getChecker } from '../services/checker'
import { inferPropTypes } from '../services/infer'

export default defineEventHandler(async (event) => {
  appendHeader(event, 'Access-Control-Allow-Origin', '*')
  const config = useAppConfig().compodium as any

  const componentsRaw = await fs.readFile(config.componentsPath, 'utf-8')
  const components = JSON.parse(componentsRaw)
  const componentId = getRouterParam(event, 'component')
  const component: NuxtComponent = componentId && components[componentId]

  if (!component || !component.filePath) {
    throw createError({
      statusMessage: 'Component not found!',
      statusCode: 404
    })
  }

  const checker = getChecker()
  checker.reload()

  const meta = checker.getComponentMeta(component.filePath)
  const parsed = meta.props.map(inferPropTypes)

  return {
    ...component,
    meta: { props: parsed }
  }
})
