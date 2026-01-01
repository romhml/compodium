import { type ComponentMeta, createCheckerByJson } from 'vue-component-meta'
import type { ComponentsDir } from '../../types'
import { inferPropTypes } from './infer'

export function createChecker(dirs: ComponentsDir[]) {
  const rootDir = process.cwd()
  const metaChecker = createCheckerByJson(
    rootDir,
    {
      extends: `${rootDir}/tsconfig.json`,
      compilerOptions: {
        allowArbitraryExtensions: true // Fixes Nuxt UI component type resolution
      },
      include: [
        '**/*',
        ...dirs?.map((dir: any) => {
          const path = typeof dir === 'string' ? dir : (dir?.path || '')
          const ext = path.split('.').pop()!
          return ['vue', 'ts', 'tsx', 'js', 'jsx'].includes(ext) ? path : `${path}/**/*`
        }) ?? []
      ],
      exclude: ['**/*.vue.d.ts']
    },
    {
      forceUseTs: true,
      schema: {
        ignore: [
          'NuxtComponentMetaNames',
          'RouteLocationRaw',
          'RouteLocationPathRaw',
          'RouteLocationNamedRaw'
        ]
      }
    }
  )

  const checker = {
    ...metaChecker,
    getComponentMeta: (componentPath: string): ComponentMeta => {
      const meta = metaChecker.getComponentMeta(componentPath)
      return {
        props: meta.props
          .filter((sch: any) => !sch.global)
          .filter(sch => !(/^on[A-Z]/.test(sch.name))) // Filter out event emitters (onXxx pattern)
          .map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, true))
          .map(inferPropTypes),

        events: meta.events.map((sch: any) => sch.name)
        // exposed: meta.exposed.map(sch => stripeTypeScriptInternalTypesSchema(sch, true)),
        // slots: meta.slots.map(sch => stripeTypeScriptInternalTypesSchema(sch, true))
      }
    }
  }
  return checker
}

export function stripeTypeScriptInternalTypesSchema(type: any, topLevel: boolean = true): any {
  if (!type) {
    return type
  }

  if (type?.name?.startsWith('__')) return false

  if (!topLevel && type.declarations && type.declarations.find((d: any) => d.file.includes('node_modules/typescript') || d.file.includes('@vue/runtime-core'))) {
    return false
  }

  if (Array.isArray(type)) {
    return type.map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, false)).filter(r => r !== false)
  }

  if (Array.isArray(type.schema)) {
    return {
      ...type,
      declarations: undefined,
      schema: type.schema.map((sch: any) => stripeTypeScriptInternalTypesSchema(sch, false)).filter((r: any) => r !== false)
    }
  }

  if (!type.schema || typeof type.schema !== 'object') {
    return typeof type === 'object' ? { ...type, declarations: undefined } : type
  }

  const schema: any = {}
  Object.keys(type.schema).forEach((sch) => {
    if (sch === 'schema' && type.schema[sch]) {
      schema[sch] = schema[sch] || {}
      Object.keys(type.schema[sch]).forEach((sch2) => {
        const res = stripeTypeScriptInternalTypesSchema(type.schema[sch][sch2], false)
        if (res !== false) {
          schema[sch][sch2] = res
        }
      })
      return
    }
    const res = stripeTypeScriptInternalTypesSchema(type.schema[sch], false)

    if (res !== false) {
      schema[sch] = res
    }
  })

  return {
    ...type,
    declarations: undefined,
    schema
  }
}
