import type { Component as NuxtComponent } from 'nuxt'
import type { InputSchema } from './runtime/server/services/infer'

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

export type ComponentMeta = NuxtComponent & {
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
