import { createCheckerByJson } from '@compodium/meta'
import type { ComponentMeta } from '../../../types'

// @ts-expect-error virtual file
import dirs from '#compodium/nitro/dirs'

let checker

export function createChecker() {
  const rootDir = process.cwd()

  const metaChecker = createCheckerByJson(
    rootDir,
    {
      extends: `${rootDir}/tsconfig.json`,
      skipLibCheck: true,
      include: [
        '**/*',
        ...dirs?.map((dir: any) => {
          const path = typeof dir === 'string' ? dir : (dir?.path || '')
          if (path.endsWith('.vue')) {
            return path
          }
          return `${path}/**/*`
        }) ?? []
      ],
      exclude: []
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
        // ...meta,
        props: meta.props.filter(sch => !sch.global).map(sch => stripeTypeScriptInternalTypesSchema(sch, true)),
        compodium: meta.compodium
        // events: meta.events.map(sch => stripeTypeScriptInternalTypesSchema(sch, true)),
        // exposed: meta.exposed.map(sch => stripeTypeScriptInternalTypesSchema(sch, true)),
        // slots: meta.slots.map(sch => stripeTypeScriptInternalTypesSchema(sch, true))
      }
    }
  }
  return checker
}

export function getChecker(): ReturnType<typeof createChecker> {
  return checker ??= createChecker()
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
