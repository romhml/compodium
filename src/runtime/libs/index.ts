import { kebabCase } from 'scule'
import { existsSync, readFileSync } from 'node:fs'
import type { NuxtOptions } from '@nuxt/schema'
import type { Resolver } from '@nuxt/kit'
import { satisfies } from 'semver'

export const buildLibraryCollections = (options: NuxtOptions) => [
  {
    id: 'ui',
    name: 'Nuxt UI',
    path: '@nuxt/ui/',
    version: '^3.0.0-alpha.1',
    external: true,
    icon: 'lineicons:nuxt',
    prefix: (options as any).ui?.prefix,
    examplePath: 'runtime/libs/examples/ui',
    ignore: ['App.vue', 'Toast.vue', '*Provider.vue', '*Base.vue', '*Content.vue'],
    getDocUrl(componentName: string) {
      const prefix = (options as any).ui?.prefix ?? 'U'
      return `https://ui3.nuxt.dev/components/${kebabCase(componentName.replace(new RegExp(`^${prefix}`), ''))}`
    }
  }
]

export async function getLibraryCollections(options: NuxtOptions, appResolver: Resolver) {
  const supportedCollections = buildLibraryCollections(options)
  const result = []

  for (const collection of supportedCollections) {
    const packagePath = appResolver.resolve(`node_modules/${collection.path}/package.json`)
    if (existsSync(packagePath)) {
      const pkg = JSON.parse(readFileSync(packagePath).toString())

      if (satisfies(pkg.version, collection.version)) {
        result.push(collection)
      }
    }
  }
  return result
}
