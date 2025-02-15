import type { Component as NuxtComponent } from 'nuxt'
import type { ComponentMeta } from 'vue-component-meta'

export type Component = NuxtComponent & {
  meta: ComponentMeta
  examples?: ComponentExample[]
}

export type ComponentExample = NuxtComponent & {
  isExample?: true
}

export type CollectionConfig = {
  name: string
  match: string | RegExp
  icon?: string
  prefix?: string
}

export type Collection = {
  id: string
  name: string
  match: string | RegExp
  external?: boolean
  icon?: string
  prefix?: string
}

export type ComponentCollection = {
  name: string
  icon?: string
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
      previewComponent?: string
      defaultPreviewComponent?: string
      rootComponent?: string
      collections: Collection[]
      exampleComponents: Record<string, NuxtComponent>
      defaultProps: Record<string, any>
    }
  }
}
