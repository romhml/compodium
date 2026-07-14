import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection, CompodiumMeta } from '@compodium/core'
import { joinURL } from 'ufo'
import { fileURLToPath } from 'node:url'
import { dirname } from 'pathe'
import { loadNativeModule } from './native-module'
import { createTestNuxtConfig } from './test-config'

describe('basic', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), './fixtures/basic'))

  await setup({
    rootDir,
    dev: true,
    port: 4545,
    setupTimeout: 30000,
    nuxtConfig: createTestNuxtConfig()
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  describe('renderer', () => {
    it('is mounted in development', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="compodium-default-preview"')
    })
  })

  describe('collections module', () => {
    it('works', async () => {
      const collections = await loadNativeModule<ComponentCollection[]>('/__compodium__/modules/collections')
      expect(collections).toContainComponent({
        pascalName: 'BasicComponentExample'
      })
    })

    it('normalizes Vite import transport markers', async () => {
      async function loadMarkedCollections(query: string) {
        const source = await $fetch<string>(`/__compodium__/modules/collections?${query}`, {
          headers: { accept: 'text/javascript' }
        })
        const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
        return (await import(moduleUrl)).default as ComponentCollection[]
      }

      const imported = await loadMarkedCollections('import')
      const importedRevision = await loadMarkedCollections('import&t=1752500000000')

      expect(imported).toContainComponent({ pascalName: 'BasicComponentExample' })
      expect(importedRevision).toEqual(imported)
    })

    it('assigns component examples', async () => {
      const collections = await loadNativeModule<ComponentCollection[]>('/__compodium__/modules/collections')
      expect(collections).toContainComponent({
        pascalName: 'BasicComponentExample',
        examples: expect.arrayContaining([
          expect.objectContaining({ pascalName: 'BasicComponentExampleWithSuffix' })
        ])
      })
    })

    it('ignores excluded components', async () => {
      const collections = await loadNativeModule<ComponentCollection[]>('/__compodium__/modules/collections')
      expect(collections).not.toContainComponent({
        pascalName: 'ExcludedComponent'
      })
    })
  })

  describe('examples module', () => {
    it('works', async () => {
      const example = await loadNativeModule<string>('/__compodium__/modules/example', {
        path: joinURL(rootDir, './compodium/examples/BasicComponentExample.vue')
      })
      expect(example).toMatchInlineSnapshot(`
        "<template>
          <BasicComponent />
        </template>
        "
      `)
    })
  })

  describe('meta module', () => {
    it('works for basic component', async () => {
      const component = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: joinURL(rootDir, '/app/components/BasicComponent.vue')
      })

      expect(component).toEqual(expect.objectContaining({
        props: [
          {
            description: '',
            global: false,
            name: 'foo',
            required: true,
            schema: [
              {
                inputType: 'string',
                schema: 'string',
                type: 'string'
              }
            ],
            tags: [],
            type: 'string'
          }
        ]
      }))
    })

    it('combines component checker metadata with selected example metadata', async () => {
      const component = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: joinURL(rootDir, '/app/components/BasicComponent.vue'),
        macro: joinURL(rootDir, '/compodium/examples/BasicComponentExampleWithSuffix.vue')
      })

      expect(component.props).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'foo' })
      ]))
      expect(component.compodium).toEqual({
        defaultProps: { fromExample: true },
        combo: ['foo']
      })
    })

    it('inherits component metadata for a macro-free selected example', async () => {
      const component = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: joinURL(rootDir, '/app/components/BasicComponent.vue'),
        macro: joinURL(rootDir, '/compodium/examples/BasicComponentExample.vue')
      })

      expect(component.props).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'foo' })
      ]))
      expect(component.compodium).toEqual({
        defaultProps: { fromComponent: true },
        combo: ['foo']
      })
    })
  })

  describe('compodium meta', async () => {
    it('works', async () => {
      const component = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: joinURL(rootDir, '/app/components/ExtendMeta.vue')
      })
      expect(component.compodium).toMatchObject({
        defaultProps: {
          foo: 'bar',
          bool: true,
          num: 123,
          nested: {
            bat: 'baz'
          },
          array: [{ foo: 'bar' }, 'hello']
        }
      })
    })

    it('filters variables', async () => {
      const component = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: joinURL(rootDir, '/app/components/ExtendMetaWithVars.vue')
      })
      expect(component.compodium).toEqual({ defaultProps: {} })
    })

    it('ignores if invalid param', async () => {
      const component = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: joinURL(rootDir, '/app/components/ExtendMetaBad.vue')
      })
      expect(component.compodium).toBeUndefined()
    })
  })

  describe('prop inference', async () => {
    let props: CompodiumMeta['props']

    beforeEach(async () => {
      const component = await loadNativeModule<CompodiumMeta>('/__compodium__/modules/meta', {
        component: joinURL(rootDir, '/app/components/ComplexComponent.vue')
      })
      props = component.props
    })

    it('works with string', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'str',
          required: true,
          type: 'string',
          schema: [
            { schema: 'string', inputType: 'string', type: 'string' }
          ]
        })
      ]))
    })

    it('works with number', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'num',
          required: true,
          type: 'number',
          schema: [
            { schema: 'number', inputType: 'number', type: 'number' }
          ]
        })
      ]))
    })

    it('works with boolean', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'bool',
          required: true,
          type: 'boolean',
          schema: [
            {
              inputType: 'boolean',
              schema: { kind: 'enum', schema: { 0: 'false', 1: 'true' }, type: 'boolean' },
              type: 'boolean'
            }
          ]
        })
      ]))
    })

    it('works with date', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          description: '',
          global: false,
          name: 'date',
          required: true,
          schema: [
            {
              inputType: 'date',
              schema: { kind: 'object', type: 'Date' },
              type: 'Date'
            }
          ],
          tags: [],
          type: 'Date'
        })
      ]))
    })

    it('works with optional string', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          description: '',
          global: false,
          name: 'maybeStr',
          required: false,
          schema: [
            {
              inputType: 'string',
              schema: {
                kind: 'enum',
                schema: { 0: 'undefined', 1: 'string' },
                type: 'string | undefined'
              },
              type: 'string | undefined'
            }
          ],
          tags: [],
          type: 'string | undefined'
        })
      ]))
    })

    it('works with multi-type', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'multipleTypes',
          description: '',
          required: true,
          type: 'string | number',
          schema: [
            { schema: 'string', inputType: 'string', type: 'string' },
            { schema: 'number', inputType: 'number', type: 'number' }
          ]
        })
      ]))
    })

    it('works with enum', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'enum',
          required: true,
          type: '"primary" | "secondary" | "tertiary"',
          schema: [
            {
              schema: {
                kind: 'enum',
                schema: ['primary', 'secondary', 'tertiary'],
                type: '"primary" | "secondary" | "tertiary"'
              },
              inputType: 'stringEnum',
              type: '"primary" | "secondary" | "tertiary"'
            }
          ]
        })
      ]))
    })

    it('works with enum list', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          global: false,
          name: 'enumList',
          required: true,
          schema: [
            {
              inputType: 'primitiveArray',
              schema: {
                kind: 'array',
                schema: [
                  {
                    kind: 'enum',
                    schema: ['primary', 'secondary', 'tertiary'],
                    type: '"primary" | "secondary" | "tertiary"'
                  }
                ],
                type: '("primary" | "secondary" | "tertiary")[]'
              },
              type: '("primary" | "secondary" | "tertiary")[]'
            }
          ],
          tags: [],
          type: '("primary" | "secondary" | "tertiary")[]'
        }
        )
      ]))
    })

    it('works with string list', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'stringList',
          required: true,
          type: 'string[]',
          schema: [
            {
              schema: { kind: 'array', schema: ['string'], type: 'string[]' },
              inputType: 'primitiveArray',
              type: 'string[]'
            }
          ]
        }
        )
      ]))
    })

    it('works with number list', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'numberList',
          required: true,
          type: 'string[]',
          schema: [
            {
              schema: {
                kind: 'array',
                schema: ['string'],
                type: 'string[]'
              },
              inputType: 'primitiveArray',
              type: 'string[]'
            }
          ]
        })
      ]))
    })

    it('works with objects', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          description: '',
          global: false,
          name: 'obj',
          required: true,
          schema: [
            {
              inputType: 'object',
              schema: {
                kind: 'object',
                schema: {
                  foo: expect.objectContaining({
                    name: 'foo',
                    required: true,
                    schema: [{ inputType: 'string', schema: 'string', type: 'string' }],
                    type: 'string'
                  }),
                  num: expect.objectContaining({
                    name: 'num',
                    required: false,
                    schema: [{
                      inputType: 'number',
                      schema: {
                        kind: 'enum',
                        schema: { 0: 'undefined', 1: 'number' },
                        type: 'number | undefined'
                      },
                      type: 'number | undefined'
                    }],
                    type: 'number | undefined'
                  })
                },
                type: '{ num?: number | undefined; foo: string; }'
              },
              type: '{ num?: number | undefined; foo: string; }'
            }
          ],
          tags: [],
          type: '{ num?: number | undefined; foo: string; }'
        })
      ]))
    })

    it('works with array objects', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          description: '',
          global: false,
          name: 'arrayObj',
          required: true,
          schema: [
            {
              inputType: 'array',
              schema: {
                kind: 'array',
                schema: [
                  {
                    inputType: 'object',
                    schema: {
                      kind: 'object',
                      schema: {
                        foo: {
                          description: '',
                          global: false,
                          name: 'foo',
                          required: true,
                          schema: [{ inputType: 'string', schema: 'string', type: 'string' }],
                          tags: [],
                          type: 'string'
                        },
                        num: {
                          description: '',
                          global: false,
                          name: 'num',
                          required: false,
                          schema: [{
                            inputType: 'number',
                            schema: {
                              kind: 'enum',
                              schema: { 0: 'undefined', 1: 'number' },
                              type: 'number | undefined'
                            },
                            type: 'number | undefined'
                          }],
                          tags: [],
                          type: 'number | undefined'
                        }
                      },
                      type: '{ num?: number | undefined; foo: string; }'
                    },
                    type: '{ num?: number | undefined; foo: string; }'
                  }
                ],
                type: '{ num?: number | undefined; foo: string; }[]'
              },
              type: '{ num?: number | undefined; foo: string; }[]'
            }
          ],
          tags: [],
          type: '{ num?: number | undefined; foo: string; }[]'
        }
        )
      ]))
    })

    it('works with nested object', async () => {
      expect(props).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: 'nested',
          global: false,
          description: '',
          tags: [],
          required: true,
          type: '{ verynested: { label: string; }[]; foo: boolean; bar: string; }',
          schema: [
            {
              schema: {
                kind: 'object',
                schema: {
                  verynested: {
                    name: 'verynested',
                    global: false,
                    description: '',
                    tags: [],
                    required: true,
                    type: '{ label: string; }[]',
                    schema: [
                      {
                        schema: {
                          kind: 'array',
                          schema: [
                            {
                              schema: {
                                kind: 'object',
                                schema: {
                                  label: {
                                    name: 'label',
                                    global: false,
                                    description: '',
                                    tags: [],
                                    required: true,
                                    type: 'string',
                                    schema: [{ schema: 'string', inputType: 'string', type: 'string' }]
                                  }
                                },
                                type: '{ label: string; }'
                              },
                              inputType: 'object',
                              type: '{ label: string; }'
                            }
                          ],
                          type: '{ label: string; }[]'
                        },
                        inputType: 'array',
                        type: '{ label: string; }[]'
                      }
                    ]
                  },
                  foo: {
                    name: 'foo',
                    global: false,
                    description: '',
                    tags: [],
                    required: true,
                    type: 'boolean',
                    schema: [
                      {
                        schema: { kind: 'enum', schema: { 0: 'false', 1: 'true' }, type: 'boolean' },
                        inputType: 'boolean',
                        type: 'boolean'
                      }
                    ]
                  },
                  bar: {
                    name: 'bar',
                    global: false,
                    description: '',
                    tags: [],
                    required: true,
                    type: 'string',
                    schema: [{ schema: 'string', inputType: 'string', type: 'string' }]
                  }
                },
                type: '{ verynested: { label: string; }[]; foo: boolean; bar: string; }'
              },
              inputType: 'object',
              type: '{ verynested: { label: string; }[]; foo: boolean; bar: string; }'
            }
          ]
        })
      ]))
    })
  })
})
