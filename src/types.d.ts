import type { Component as NuxtComponent } from 'nuxt'
import type { ComponentMeta } from 'vue-component-meta'

export type Component = NuxtComponent & {
  meta: ComponentMeta
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
  docUrl?: (componentName: string) => string
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
  components: Record<string, Component>
}

declare module 'nuxt/schema' {
  interface AppConfigInput {
    compodium?: {
      defaultProps?: Record<string, any>
    }
  }

  interface AppConfig {
    ui?: {
      colors: any
    }

    compodium: {
      componentsPath: string
      collections: Collection[]
      defaultProps?: Record<string, any>
    }
  }
}
