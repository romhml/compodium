import { kebabCase } from 'scule'

export type LibraryCollection = {
  name: string
  package: string
  version: string
  icon?: string
  exampleDir: string
  ignore?: string[]
  getDocUrl?: (component: string) => string
  defaultProps?: Record<string, any>
}

export const libraryCollections = [
  {
    name: 'Nuxt UI',
    package: '@nuxt/ui',
    version: '^3.0.0-alpha.1',
    icon: 'lineicons:nuxt',
    exampleDir: import.meta.resolve('./examples/ui'),
    ignore: ['App.vue', 'Toast.vue', '*Provider.vue', '*Base.vue', '*Content.vue'],
    getDocUrl(componentName: string) {
      const prefix = 'U' // TODO: Handle user defined prefix
      return `https://ui3.nuxt.dev/components/${kebabCase(componentName.replace(new RegExp(`^${prefix}`), ''))}`
    }
  }
] as LibraryCollection[]
