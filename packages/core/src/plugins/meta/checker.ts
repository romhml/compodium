import { existsSync } from 'node:fs'
import { basename } from 'node:path'
import { createCheckerByJson } from 'vue-component-meta'
import type { CompodiumMeta, ComponentsDir } from '../../types'
import { inferPropTypes } from './infer'

type MetaChecker = ReturnType<typeof createCheckerByJson>

const checkerOptions = {
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

export function createChecker(dirs: ComponentsDir[], rootDir = process.cwd(), tsconfigPath?: string) {
  const metaChecker = createMetaChecker(dirs, rootDir, tsconfigPath)

  const checker = {
    ...metaChecker,
    getComponentMeta: (componentPath: string): CompodiumMeta => {
      const meta = getComponentMeta(metaChecker, componentPath)
      return {
        props: meta.props
          .filter((sch: any) => !sch.global)
          .filter((sch: any) => !(/^on[A-Z]/.test(sch.name))) // Filter out event emitters (onXxx pattern)
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

function createMetaChecker(dirs: ComponentsDir[], rootDir: string, tsconfigPath?: string): MetaChecker {
  const tsconfig = `${rootDir}/tsconfig.json`
  const tsconfigToExtend = tsconfigPath && existsSync(tsconfigPath) ? tsconfigPath : tsconfig

  // Keep a JSON wrapper so library components outside Nuxt's app tsconfig include set remain inspectable.
  return createCheckerByJson(
    rootDir,
    {
      ...(existsSync(tsconfigToExtend) ? { extends: tsconfigToExtend } : {}),
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
      ]
    },
    checkerOptions
  )
}

function getComponentMeta(metaChecker: MetaChecker, componentPath: string) {
  if (!componentPath.endsWith('.vue')) {
    return metaChecker.getComponentMeta(componentPath)
  }

  const metaEntryPath = `${componentPath}.compodium-meta.ts`
  const componentImportPath = `./${basename(componentPath)}`
  // vue-component-meta needs a named export to inspect virtual .vue component metadata reliably.
  metaChecker.updateFile(metaEntryPath, `import Component from ${JSON.stringify(componentImportPath)}\nexport const CompodiumMetaComponent = Component\nexport default Component\n`)

  return metaChecker.getComponentMeta(metaEntryPath, 'CompodiumMetaComponent')
}

export function isNativeBrowserType(typeName: string): boolean {
  const nativeTypes = [
    // HTML Elements
    'HTMLElement', 'HTMLCanvasElement', 'HTMLDivElement', 'HTMLSpanElement',
    'HTMLInputElement', 'HTMLButtonElement', 'HTMLFormElement', 'HTMLImageElement',
    'HTMLAnchorElement', 'HTMLLinkElement', 'HTMLScriptElement', 'HTMLStyleElement',
    'HTMLTableElement', 'HTMLIFrameElement', 'HTMLVideoElement', 'HTMLAudioElement',
    'HTMLSelectElement', 'HTMLOptionElement', 'HTMLTextAreaElement', 'HTMLLabelElement',
    'HTMLSlotElement',
    // DOM
    'Element', 'Document', 'Window', 'Node', 'NodeList', 'HTMLCollection',
    'DOMTokenList', 'NamedNodeMap', 'DocumentFragment', 'ShadowRoot',
    // Events
    'Event', 'MouseEvent', 'KeyboardEvent', 'FocusEvent', 'InputEvent',
    'EventTarget', 'EventListener',
    // Canvas/WebGL
    'CanvasRenderingContext2D', 'WebGLRenderingContext', 'WebGL2RenderingContext',
    'ImageBitmap', 'OffscreenCanvas',
    // Media
    'MediaStream', 'MediaStreamTrack', 'MediaRecorder',
    // Storage/Data
    'Storage', 'SessionStorage', 'LocalStorage', 'DOMStringMap',
    // Node.js types
    'Buffer', 'Process', 'Stream'
  ]
  return nativeTypes.includes(typeName)
}

export function stripeTypeScriptInternalTypesSchema(type: any, topLevel: boolean = true): any {
  if (!type) {
    return type
  }

  if (type?.name?.startsWith('__')) return false

  // Check if this type's schema is a native browser/Node type
  if (type.schema && typeof type.schema === 'object' && type.schema.kind === 'object'
    && typeof type.schema.type === 'string' && isNativeBrowserType(type.schema.type)) {
    return false
  }

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
