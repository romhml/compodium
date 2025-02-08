import type { Resolver } from '@nuxt/kit'
import type { ModuleOptions } from './module'

export function compodiumMetaPlugin(_: { options: ModuleOptions, resolve: Resolver['resolve'] }) {
  return {
    name: 'compodium-meta',
    enforce: 'pre' as const,
  }
}
