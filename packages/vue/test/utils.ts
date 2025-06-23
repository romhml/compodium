import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compodium } from '../src/index'
import type { PluginOptions } from '@compodium/core'
import request from 'supertest'

import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'
import { dirname } from 'pathe'
import defu from 'defu'
import type { ViteUserConfig } from 'vitest/config'

export async function createViteServer(path: string, viteOptions?: Partial<ViteUserConfig>, options?: Partial<PluginOptions>) {
  const root = fileURLToPath(joinURL(dirname(import.meta.url), path))
  const server = await createServer(defu({
    root,
    plugins: [
      vue(),
      compodium({ rootDir: root, ...options })
    ],
    server: {
      middlewareMode: true
    },
    resolve: {
      alias: {
        '@': fileURLToPath(joinURL(dirname(import.meta.url), joinURL(path, './src')))
      }
    }
  }, viteOptions))
  return request(server.middlewares)
}
