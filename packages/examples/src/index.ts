import { dirname, resolve as _resolve } from 'pathe'
import { kebabCase } from 'scule'
import { fileURLToPath } from 'node:url'

export type LibraryCollection = {
  name: string
  package: string
  icon: string
  prefix?: string
  ignore?: string[]
  exampleDir: string
  wrapperComponent?: string
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
    icon: 'lineicons:nuxt',
    exampleDir: resolve('./examples/ui'),
    path: 'node_modules/@nuxt/ui/dist/runtime/components',
    ignore: ['App.vue', 'Toast.vue', '*Provider.vue', '*Base.vue', '*Content.vue'],
    prefix: 'U',
    wrapperComponent: resolve('./examples/ui.vue'),
    getDocUrl(componentName: string) {
      const prefix = 'U' // TODO: Handle user defined prefix
      return `https://ui.nuxt.com/components/${kebabCase(componentName.replace(new RegExp(`^${prefix}`), ''))}`
    }
  }
] as LibraryCollection[]
