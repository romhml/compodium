import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'
import { dirname } from 'pathe'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)

describe('prod', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/basic'))
  await execFile('pnpm', ['exec', 'nuxi', 'build', rootDir], { cwd: process.cwd() })
  await setup({
    rootDir,
    dev: false,
    build: false,
    setupTimeout: 30000,
    nuxtConfig: {
      nitro: { output: { dir: joinURL(rootDir, '.output') } }
    }
  })

  it('renderer is not injected in production', async () => {
    const html = await $fetch('/__compodium__/renderer')
    expect(html).not.toContain('<div id="compodium-renderer" class="compodium-component-renderer"><!----></div>')
    expect(html).toContain('<div>basic</div>')
  })
})
