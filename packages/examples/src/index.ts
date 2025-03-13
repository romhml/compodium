import { dirname, resolve as _resolve } from 'pathe'
import { kebabCase } from 'scule'
import { fileURLToPath } from 'node:url'

export type LibraryCollection = {
  name: string
  package: string
  icon: string
  version?: string
  prefix?: string
  ignore?: string[]
  exampleDir: string
  path: string
  getDocUrl?: (componentName: string) => string
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
