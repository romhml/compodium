import type { NuxtConfig } from 'nuxt/schema'
import { createServer } from 'node:http'

export function createTestNuxtConfig(): NuxtConfig {
  const hmrServer = createServer()

  return {
    vite: {
      server: { hmr: { server: hmrServer }, ws: false },
      optimizeDeps: { noDiscovery: true, include: [] },
      plugins: [{
        name: 'compodium:test-transport',
        config() {
          return { server: { hmr: { server: hmrServer }, ws: false } }
        }
      }]
    }
  }
}
