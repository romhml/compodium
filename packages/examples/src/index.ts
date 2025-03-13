import { dirname, resolve as _resolve } from 'pathe'
import { kebabCase } from 'scule'
import { fileURLToPath } from 'node:url'
import type { ComponentsDirs } from '@compodium/core'

export type LibraryCollection = ComponentsDirs & {
  name: string
  package: string
  version: string
  icon?: string
  exampleDir: string
  getDocUrl?: (component: string) => string
}

function resolve(path: string) {
  return _resolve(dirname(fileURLToPath(import.meta.url)), path)
}

export const libraryCollections = [
  {
    name: 'Nuxt UI',
    package: '@nuxt/ui',
    version: '^3.0.0-alpha.1',
    icon: 'lineicons:nuxt',
    exampleDir: resolve('./examples/ui'),
    path: 'node_modules/@nuxt/ui/dist/runtime/components',
    ignore: ['App.vue', 'Toast.vue', '*Provider.vue', '*Base.vue', '*Content.vue'],
    prefix: 'U',
    getDocUrl(componentName: string) {
      const prefix = 'U' // TODO: Handle user defined prefix
      return `https://ui3.nuxt.dev/components/${kebabCase(componentName.replace(new RegExp(`^${prefix}`), ''))}`
    }
  }
] as LibraryCollection[]
