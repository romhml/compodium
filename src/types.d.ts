import type { ComponentData as NuxtComponentData } from 'nuxt-component-meta'

export type Component = NuxtComponentData & {
  examples?: ComponentExample[]
}

export type ComponentExample = NuxtComponentData & {
  componentName: string
  isExample?: true
}

export interface Collection {
  name: string
  wrapperComponent?: string
  match: string | RegExp
  external?: boolean
  icon?: string
}

export type ComponentCollection = {
  name: string
  icon?: string
  components: Record<string, Component>
}
