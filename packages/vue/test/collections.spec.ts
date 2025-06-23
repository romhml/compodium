import { describe, expect, it } from 'vitest'

import { createViteServer } from './utils'

describe('collections api', async () => {
  const server = await createViteServer('./fixtures/basic')
  const resp = await server.get('/__compodium__/api/collections')
  const collections = resp.body

  it('works', async () => {
    expect(collections).toContainComponent({
      pascalName: 'BasicComponent'
    })
  })

  it('includes component examples', async () => {
    expect(collections).toContainComponent({
      pascalName: 'BasicComponent',
      examples: [
        expect.objectContaining({ pascalName: 'BasicComponentExampleWithFoo' })
      ]
    })
  })

  it('replace component with main example', async () => {
    expect(collections).toContainComponent({
      pascalName: 'TestComponentExample',
      examples: [
        expect.objectContaining({ pascalName: 'TestComponentExampleWithFoo' })
      ]
    })
  })
})
