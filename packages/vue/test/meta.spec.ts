import { describe, expect, it } from 'vitest'

import { fileURLToPath } from 'node:url'
import { joinURL } from 'ufo'
import { dirname } from 'pathe'

import { createViteServer } from './utils'

const componentPath = (name: string) => fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/basic/src/components', name))

describe('meta api', async () => {
  const server = await createViteServer('./fixtures/basic')

  it('describes a component it can resolve', async () => {
    const resp = await server.get('/__compodium__/api/meta').query({ component: componentPath('BasicComponent.vue') })

    expect(resp.status).toBe(200)
    expect(resp.body.props.map((prop: { name: string }) => prop.name)).toContain('foo')
  }, 30_000)

  it('answers 404 for a component that does not exist', async () => {
    const resp = await server.get('/__compodium__/api/meta').query({ component: componentPath('MissingComponent.vue') })

    expect(resp.status).toBe(404)
  })

  it('answers 400 when no component is named', async () => {
    const resp = await server.get('/__compodium__/api/meta')

    expect(resp.status).toBe(400)
  })
})
