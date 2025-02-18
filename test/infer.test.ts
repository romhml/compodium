// @vitest-environment node
import { it, expect, describe } from 'vitest'
import { inferSchemaType } from '../src/runtime/server/services/infer'
import { stringSchema, optionalStringSchema, booleanSchema, numberSchema, optionalNumberSchema, optionalBooleanSchema, objectSchema, arraySchema, arrayOptionalSchema, stringEnumSchema, complexEnumSchema, complexArraySchema } from './fixtures/schemas'

describe('inferSchemaTypes', () => {
  it.each([
    ['string', { schema: stringSchema, inputIds: ['string'] }],
    ['optional string', { schema: optionalStringSchema, inputIds: ['string'] }],
    ['number', { schema: numberSchema, inputIds: ['number'] }],
    ['optional number', { schema: optionalNumberSchema, inputIds: ['number'] }],
    ['boolean', { schema: booleanSchema, inputIds: ['boolean'] }],
    ['string enum', { schema: stringEnumSchema, inputIds: ['stringEnum'] }],
    ['object', { schema: objectSchema, inputIds: ['object'] }],
    ['optional boolean', { schema: optionalBooleanSchema, inputIds: ['boolean'] }],
    ['array', { schema: arraySchema, inputIds: ['array'] }],
    ['optional array', { schema: arrayOptionalSchema, inputIds: ['array'] }],
    ['complex enum schema', { schema: complexEnumSchema, inputIds: ['string', 'number', 'object'] }],
    ['complex array schema', { schema: complexArraySchema, inputIds: ['array'] }]
  ])('resolveInputSchema should resolve %s schema', async (_: string, options) => {
    const result = inferSchemaType(options.schema as any)
    expect(result?.map(r => r.inputType)).toMatchObject(options.inputIds)
  })
})
