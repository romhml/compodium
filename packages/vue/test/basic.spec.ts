import { describe, expect, it } from 'vitest'
import { createViteServer } from './utils'

describe('basic', async () => {
  const server = await createViteServer('./fixtures/basic')

  it('renders the index page', async () => {
    const resp = await server.get('/')
    expect(resp.text).toMatchSnapshot()
  })

  it('injects devtools script in the index page', async () => {
    const resp = await server.get('/')
    expect(resp.text).toContain('<script type="module" src="/@id/virtual:compodium:devtools"></script>')
  })
})
