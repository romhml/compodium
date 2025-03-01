import { resolve } from 'pathe'
import { describe, it, expect, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { ComponentCollection, ComponentMeta } from '~/src/types'

describe('basic', async () => {
  await setup({
    rootDir: resolve('./test/fixtures/basic'),
    dev: true,
    env: {
      COMPODIUM_TEST: 'true'
    }
  })

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/')
    expect(html).toContain('<div>basic</div>')
  })

  describe('renderer', () => {
    it('is mounted in development', async () => {
      const html = await $fetch('/__compodium__/renderer')
      expect(html).toContain('<div id="compodium-default-preview">')
    })
  })

  describe('collections api', () => {
    it('works', async () => {
      const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
      expect(collections).toEqual({
        components: expect.objectContaining({
          name: 'Components',
          id: 'components',
          components: expect.objectContaining({ basicComponent: expect.objectContaining({ componentId: 'basicComponent', collectionId: 'components' }) })
        })
      })
    })

    it('assigns component examples', async () => {
      const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
      expect(collections.components.components.basicComponent.examples).toEqual([
        expect.objectContaining({
          baseName: 'ComponentsBasicComponentExampleWithSuffix',
          collectionId: 'components',
          componentId: 'basicComponent',
          shortPath: 'compodium/components/BasicComponentExampleWithSuffix.vue',
          isExample: true,
          name: 'WithSuffix',
          pascalName: 'ComponentsBasicComponentExampleWithSuffix'
        })
      ])
    })

    it('overrides component with main example', async () => {
      const collections = await $fetch<Record<string, ComponentCollection>>('/__compodium__/api/collections')
      expect(collections.components.components.basicComponent).toEqual(expect.objectContaining({
        pascalName: 'ComponentsBasicComponentExample',
        shortPath: 'compodium/components/BasicComponentExample.vue',
        collectionId: 'components',
        componentId: 'basicComponent'
      }))
    })
  })

  describe('examples api', () => {
    it('works', async () => {
      const example = await $fetch('/__compodium__/api/example/componentsBasicComponentExample')
      expect(example).toMatchInlineSnapshot(`
        "<template>
          <BasicComponent />
        </template>
        "
      `)
    })
  })

  describe('component-meta api', () => {
    it('works for basic component', async () => {
      const component = await $fetch('/__compodium__/api/component-meta/basicComponent')
      expect(component).toEqual(expect.objectContaining({
        pascalName: 'BasicComponent',
        meta: expect.objectContaining({
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
        })
      }))
    })
  })

  describe('compodium meta', async () => {
    it('works', async () => {
      const component = await $fetch<ComponentMeta>('/__compodium__/api/component-meta/withExtendMeta')
      expect(component.meta.compodium).toMatchObject({
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
  })

  describe('prop inference', async () => {
    let props: ComponentMeta['meta']['props']

    beforeEach(async () => {
      const component = await $fetch<ComponentMeta>('/__compodium__/api/component-meta/complexComponent')
      props = component.meta.props
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
            { inputType: 'string', schema: 'string', type: 'string' }
          ],
          tags: [],
          type: 'string'
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
                    schema: [{ inputType: 'number', schema: 'number', type: 'number' }],
                    type: 'number'
                  })
                },
                type: '{ num?: number; foo: string; }'
              },
              type: '{ num?: number; foo: string; }'
            }
          ],
          tags: [],
          type: '{ num?: number; foo: string; }'
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
                          schema: [{ inputType: 'number', schema: 'number', type: 'number' }],
                          tags: [],
                          type: 'number'
                        }
                      },
                      type: '{ num?: number; foo: string; }'
                    },
                    type: '{ num?: number; foo: string; }'
                  }
                ],
                type: '{ num?: number; foo: string; }[]'
              },
              type: '{ num?: number; foo: string; }[]'
            }
          ],
          tags: [],
          type: '{ num?: number; foo: string; }[]'
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
