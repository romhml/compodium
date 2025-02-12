import type { ComponentData as NuxtComponentData } from 'nuxt-component-meta'

export type Component = NuxtComponentData & {

}

export interface Collection {
  name: string
  wrapperComponent?: string
  match: string | RegExp
  external?: boolean
}

export type ComponentCollection = Record<string, Component>
