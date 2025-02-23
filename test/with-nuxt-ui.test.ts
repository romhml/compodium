import { resolve } from 'pathe'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('with nuxt ui', async () => {
  await setup({
    rootDir: resolve('./test/fixtures/with-nuxt-ui'),
    dev: true
  })

  describe('collections api', () => {
    it('works', async () => {
      const collections = await $fetch('/__compodium__/api/collections')
      expect(collections).toEqual({
        components: expect.objectContaining({
          name: 'Components',
          id: 'components',
          components: expect.objectContaining({ basicComponent: expect.objectContaining({ componentId: 'basicComponent', collectionId: 'components' }) })
        }),
        ui: expect.objectContaining({
          name: 'Nuxt UI',
          id: 'ui',
          components: expect.objectContaining({ button: expect.objectContaining({ componentId: 'button', collectionId: 'ui' }) })
        })
      })
    })
  })

  describe('component-meta api', () => {
    it('works for basic component', async () => {
      const component = await $fetch('/__compodium__/api/component-meta/button')
      expect(component).toEqual(expect.objectContaining({
        pascalName: 'UButton',
        meta: {
          props: expect.arrayContaining([
            expect.objectContaining({
              name: 'label',
              schema: [
                {
                  inputType: 'string',
                  schema: 'string',
                  type: 'string'
                }
              ],
              type: 'string'
            })
          ])
        }
      }))
    })
  })

  describe('examples api', () => {
    it('works', async () => {
      const example = await $fetch('/__compodium__/api/example/uChipExample')
      expect(example).toMatchInlineSnapshot(`
        "<template>
          <UChip>
            <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" />
          </UChip>
        </template>
        "
      `)
    })
  })
})
