import type { Component as _Component } from '@nuxt/schema'
import type { ComponentMeta } from 'vue-component-meta'

export type Component = _Component & {
  meta: ComponentMeta
}
