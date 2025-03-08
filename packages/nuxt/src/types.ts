import type { PropertyMeta as VuePropertyMeta } from '@compodium/meta'
import type { Component as NuxtComponent } from '@nuxt/schema'
import type { Hookable } from 'hookable'

export type IconifyIcon = string & {}

import type { InputSchema } from './plugins/meta/infer'

export type * from './plugins/meta/infer'

export type PropInputType = 'array' | 'object' | 'stringEnum' | 'primitiveArray' | 'array' | 'string' | 'number' | 'boolean' | 'date' | 'icon'

type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never
type FilterStringLiteral<T> = {
  [K in keyof T]: T[K] extends StringLiteral<T[K]> ? K : never;
}[keyof T]

type ComboItem<T> = keyof FilterStringLiteral<T> | undefined
type Combo<T> = [ComboItem<T>, ComboItem<T>] | [ComboItem<T>]

export type CompodiumMeta<T = Record<string, any>> = {
  compodium?: {
    combo?: Combo<T>
    defaultProps?: Partial<T>
  }
  props: PropertyMeta[]
}

export type PropSchema = {
  inputType: PropInputType
  description?: string
  default?: string
  type: string
  schema: InputSchema
}

export type PropertyMeta = Omit<VuePropertyMeta, 'schema'> & {
  schema: PropSchema[]
}

export type Component = NuxtComponent & {
  examples: ComponentExample[]
}

export type ComponentExample = NuxtComponent & {
  isExample: true
}

export type CollectionConfig = {
  id?: string
  name: string
  path: string
  icon?: string
  prefix?: string
  ignore?: string[]
  examplesPath?: string
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
  components: Component[]
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
      matchUIColors?: boolean
    }
  }
}

export interface CompodiumHooks {
  'component:collections': () => ComponentCollection[]

  'component:meta': (path: string) => CompodiumMeta

  // Triggered when the components code has been updated
  'component:changed': () => void

  // Triggered when a new component has been added
  'component:added': () => void

  // Triggered when a component has been deleted
  'component:removed': () => void

  // Called after the renderer has mounted
  'renderer:mounted': () => void

  // Update the renderer component
  'renderer:update-component': (payload: { path: string, props: Record<string, any> }) => void

  // Update the renderer props
  'renderer:update-props': (payload: { props: Record<string, any> }) => void

  // Update the renderer combo (displaying multiple variants)
  'renderer:update-combo': (payload: { props: { value: string, options: string[] }[] }) => void

  // Update the renderer colorMode
  'renderer:set-color': (color: 'light' | 'dark') => void

  // Toggle the renderer grid
  'renderer:grid': (payload: { enabled: boolean, gap: number }) => void
}

declare global {
  interface Window {
    /**
     * Compodium Hooks for the renderer and devtools
     */
    __COMPODIUM_HOOKS__?: Hookable<CompodiumHooks>
  }
}
