import { describe, it, expect, vi } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import { joinURL } from 'ufo'
import { fileURLToPath } from 'node:url'
import { writeFile, rm } from 'node:fs/promises'
import { dirname } from 'pathe'

describe('i18n', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/i18n'))

  await setup({
    rootDir,
    dev: true,
    port: 4547,
    setupTimeout: 30000
  })

  it('renders the localized index page', async () => {
    const html = await $fetch('/en')
    expect(html).toContain('<div>i18n</div>')
  })

  describe('renderer', () => {
    it('is mounted on the unprefixed path with strategy prefix', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="compodium-default-preview"')
    })

    it('is not redirected by browser language detection', async () => {
      const html = await $fetch('/__compodium__/renderer', {
        headers: { 'accept-language': 'it-IT,it;q=0.9' }
      })
      expect(html).toContain('<div id="compodium-default-preview"')
    })

    it('survives a pages rebuild', async () => {
      const tempPage = joinURL(rootDir, 'app/pages/temp.vue')
      await writeFile(tempPage, '<template><div>temp page</div></template>\n')
      try {
        await vi.waitFor(async () => {
          expect(await $fetch('/en/temp')).toContain('temp page')
        }, { timeout: 15000, interval: 500 })
        const html = await $fetch('/__compodium__/renderer')
        expect(html).toContain('<div id="compodium-default-preview"')
      } finally {
        await rm(tempPage, { force: true })
      }
    })
  })
})
