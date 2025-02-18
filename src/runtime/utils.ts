import type { Collection, CollectionConfig } from '../types'
import micromatch from 'micromatch'
import type { Component } from '@nuxt/schema'

export function getComponentCollection<T = Collection | CollectionConfig>(component: Component, collections: T[]) {
  return collections.find((c: any) => {
    if (!c.external && component.filePath?.match('node_modules/')) return false
    return micromatch.isMatch(component.filePath, [c.path], { ignore: c.ignore, contains: true })
  })
}
