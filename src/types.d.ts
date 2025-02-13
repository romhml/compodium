import type { ComponentData as NuxtComponentData } from 'nuxt-component-meta'

export type Component = NuxtComponentData & {

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
