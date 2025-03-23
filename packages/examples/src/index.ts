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
  pattern: string
  pathPrefix: boolean
  getExportName?: (componentName: string) => string
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
    path: 'node_modules/@nuxt/ui/dist/runtime/components/',
    pattern: '**/*.vue',
    ignore: ['App.vue', 'Toast.vue', '*Provider.vue', '*Base.vue', '*Content.vue'],
    prefix: 'U',
    pathPrefix: false,
    wrapperComponent: resolve('./examples/ui.vue'),
    getDocUrl(componentName: string) {
      const prefix = 'U' // TODO: Handle user defined prefix
      return `https://ui.nuxt.com/components/${kebabCase(componentName.replace(new RegExp(`^${prefix}`), ''))}`
    }
  },
  {
    name: 'PrimeVue',
    package: 'primevue',
    version: '^4.3.2',
    icon: 'simple-icons:primevue',
    exampleDir: resolve('./examples/primevue'),
    path: 'node_modules/primevue/',
    pattern: '**/*.vue',
    pathPrefix: false,
    ignore: ['**/*Base*.vue']
  },
  {
    name: 'Reka UI',
    package: 'reka-ui',
    version: '^2.1.0',
    exampleDir: resolve('./examples/reka/dist'),
    path: 'node_modules/reka-ui/',
    pattern: '**/*Root.js',
    pathPrefix: false,
    getExportName() {
      return '_'
    }
  },
  {
    name: 'Vuetify',
    package: 'vuetify',
    version: '^3.7.18',
    icon: 'devicon-plain:vuetify',
    exampleDir: resolve('./examples/vuetify'),
    path: 'node_modules/vuetify',
    pattern: 'lib/components/**/index.mjs',
    pathPrefix: false,
    ignore: [],
    getExportName(componentName: string) {
      return componentName
    }
  }
] as LibraryCollection[]
