import type { Component as NuxtComponent } from 'nuxt'
import type { ComponentMeta } from 'vue-component-meta'

export type Component = NuxtComponent & {
  meta: ComponentMeta
  examples?: ComponentExample[]
}

export type ComponentExample = NuxtComponent & {
  isExample?: true
}

export type Collection = {
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
