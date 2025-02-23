import type { Component as NuxtComponent } from 'nuxt'
import type { InputSchema } from './runtime/server/services/infer'
import type { Hookable } from 'hookable'

export type PropInputType = 'string' | 'number' | 'array' | 'object' | 'stringEnum' | 'primitiveArray' | 'array' | 'boolean' | 'date'

export type PropSchema = {
  inputType: PropInputType
  description?: string
  default?: string
  type: string
  schema: InputSchema
}

export type PropertyType = Omit<PropertyMeta, 'schema'> & {
  schema: PropSchema[]
}

export type Component = NuxtComponent & {
  // Base name of the component without collection prefix.
  // Mainly to resolve default values in appConfig
  baseName: string
  // Unique component identifier (with collection prefix)
  componentId: string
}

export type ComponentMeta = Component & {
  meta: {
    props: PropSchema
  }
  examples?: ComponentExample[]
}

export type ComponentExample = NuxtComponent & {
  isExample: true
}

export type CollectionConfig = {
  name: string
  path: string
  icon?: string
  prefix?: string
  ignore?: string[]
  getDocUrl?: (componentName: string) => string
}

export type Collection = {
  id: string
  name: string
  path: string
  external?: boolean
  icon?: string
  prefix?: string
  ignore?: string[]
}

export type ComponentCollection = Collection & {
  components: Record<string, ComponentMeta>
}

declare module 'nuxt/schema' {
  interface AppConfigInput {
    compodium?: {
      defaultProps?: Record<string, any>
    }
  }

  interface AppConfig {
    compodium: {
      componentsPath: string
      collections: Collection[]
      defaultProps?: Record<string, any>
    }
  }
}

export interface CompodiumHooks {
  // Triggered when the components code has been updated
  'component:changed': () => void

  // Triggered when a new component has been added
  'component:added': () => void

  // Triggered when a component has been deleted
  'component:removed': () => void

  // Triggered when a component has been loaded by the renderer
  'renderer:component-loaded': () => void

  // Update the devtools props
  'devtools:update-default-props': (payload: { componentId: string, defaultProps: Record<string, any> }) => void

  // Called after the renderer has mounted
  'renderer:mounted': () => void

  // Update the renderer component
  'renderer:update-component': (payload: { collectionId: string, componentId: string, baseName: string, path: string }) => void

  // Update the renderer props
  'renderer:update-props': (payload: { props: Record<string, any> }) => void

  // Update the renderer colorMode
  'renderer:set-color': (color: 'light' | 'dark') => void
}

declare global {
  interface Window {
    /**
     * Compodium Hooks for the renderer and devtools
     */
    __COMPODIUM_HOOKS__?: Hookable<CompodiumHooks>
  }
}
