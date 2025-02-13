// @vitest-environment node
import { it, expect, describe } from 'vitest'
import { inferPropType } from '../../app/helpers/infer'
import { stringSchema, optionalStringSchema, booleanSchema, numberSchema, optionalNumberSchema, optionalBooleanSchema, objectSchema, arraySchema, arrayOptionalSchema, stringEnumSchema } from '../fixtures/schemas'

describe('usePropSchema', () => {
  it.each([
    ['string', { schema: stringSchema, inputId: 'string' }],
    ['optional string', { schema: optionalStringSchema, inputId: 'string' }],
    ['number', { schema: numberSchema, inputId: 'number' }],
    ['optional number', { schema: optionalNumberSchema, inputId: 'number' }],
    ['boolean', { schema: booleanSchema, inputId: 'boolean' }],
    ['string enum', { schema: stringEnumSchema, inputId: 'stringEnum' }],
    ['object', { schema: objectSchema, inputId: 'object' }],
    ['optional boolean', { schema: optionalBooleanSchema, inputId: 'boolean' }],
    ['array', { schema: arraySchema, inputId: 'array' }],
    ['optional array', { schema: arrayOptionalSchema, inputId: 'array' }]
  ])('resolveInputSchema should resolve %s schema', async (_: string, options) => {
    const result = inferPropType(options.schema as any)
    expect(result?.resolver.id).toBe(options.inputId)
  })
})
