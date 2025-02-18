import type { PropertyMeta as VuePropertyMeta } from 'vue-component-meta'
import { type ZodSchema, z } from 'zod'
import type { PropSchema, PropInputType, PropertyType } from '../../../types'

// Define a type for a resolver that includes an ID and a Zod schema.
export type PropSchemaResolver<T extends ZodSchema> = {
  inputType: PropInputType
  schema: T
}

const primitiveSchema = z.enum(['number', 'string'])
  .or(
    z.object({
      kind: z.literal('enum'),
      schema: z.array(z.string())
        .or(z.record(z.any(), z.string()).transform<string[]>(t => Object.values(t)))
        .transform<string[]>(t => t.filter(s => s.trim().match(/^["'`]/)).map(s => s.trim().replaceAll(/["'`]/g, '')))
        .pipe(z.array(z.string()).min(1))
    }))

const stringInputSchema = z.literal('string').or(
  z.object({
    kind: z.literal('enum'),
    schema: z.record(z.string(), z.enum(['string', 'null', 'undefined'])),
    type: z.string()
  })).or(z.string().transform(t => t.split('|').find(s => s.trim() === 'string')).pipe(z.string()))

export type StringInputSchema = z.infer<typeof stringInputSchema>

const numberInputSchema = z.literal('number').or(
  z.object({
    kind: z.literal('enum'),
    schema: z.record(z.string(), z.enum(['number', 'null', 'undefined'])),
    type: z.string()
  })).or(z.string().transform(t => t.split('|').find(s => s.trim() === 'number')).pipe(z.string()))

export type NumberInputSchema = z.infer<typeof numberInputSchema>

const booleanInputSchema = z.literal('boolean').or(
  z.object({
    kind: z.literal('enum'),
    schema: z.record(z.any(), z.enum(['boolean', '"indeterminate"', 'false', 'true', 'null', 'undefined'])),
    type: z.string()
  })).or(z.string().refine(type => type.split('|').every(t => ['boolean', 'true', 'false', 'undefined'].includes(t))).pipe(z.array(z.string()).min(1)))

export type BooleanInputSchema = z.infer<typeof booleanInputSchema>

const dateInputSchema = z.object({
  kind: z.literal('object'),
  type: z.literal('Date')
})

export type DateInputSchema = z.infer<typeof dateInputSchema>

const stringEnumInputSchema = z.object({
  kind: z.literal('enum'),
  schema: z.array(z.string())
    .or(z.record(z.any(), z.string()).transform<string[]>(t => Object.values(t)))
    .transform<string[]>(t => t.filter(s => s.trim().match(/^["'`]/)).map(s => s.trim().replaceAll(/["'`]/g, '')))
    .pipe(z.array(z.string()).min(1)),
  type: z.string()
})

export type StringEnumInputSchema = z.infer<typeof stringEnumInputSchema>

const objectInputSchema = z.object({
  kind: z.literal('object'),
  schema: z.record(z.string(), z.any()),
  type: z.string()
})

export type ObjectInputSchema = z.infer<typeof objectInputSchema>

const primitiveArrayInputSchema = z.object({
  kind: z.literal('array'),
  schema: z.array(z.any())
    .or(z.record(z.any(), primitiveSchema).transform(t => Object.values(t)))
    .transform(t => t.filter(s => s !== 'undefined')).pipe(z.array(primitiveSchema).max(1)),
  type: z.string()
})

export type PrimitiveArrayInputSchema = z.infer<typeof primitiveArrayInputSchema>

const arrayInputSchema = z.object({
  kind: z.literal('array'),
  schema: z.array(z.any({}))
    .or(z.record(z.any(), z.any({})).transform(t => Object.values(t)))
    .transform((t) => {
      return t.filter(s => s !== 'undefined')
    }).pipe(z.array(z.any()).min(1)),
  type: z.string()
})

export type ArrayInputSchema = z.infer<typeof arrayInputSchema>
export type InputSchema = StringInputSchema | BooleanInputSchema | NumberInputSchema | ObjectInputSchema | DateInputSchema | ArrayInputSchema | PrimitiveArrayInputSchema

// List of available inputs
const propResolvers: PropSchemaResolver<ZodSchema>[] = [
  { inputType: 'string', schema: stringInputSchema },
  { inputType: 'number', schema: numberInputSchema },
  { inputType: 'boolean', schema: booleanInputSchema },
  { inputType: 'date', schema: dateInputSchema },
  { inputType: 'stringEnum', schema: stringEnumInputSchema },
  { inputType: 'object', schema: objectInputSchema },
  { inputType: 'primitiveArray', schema: primitiveArrayInputSchema },
  { inputType: 'array', schema: arrayInputSchema }
]

export function inferPropTypes(prop: VuePropertyMeta): PropertyType {
  return {
    ...prop,
    schema: inferSchemaType(prop.schema)
  }
}

export function inferSchemaType(schema: string | VuePropertyMeta['schema'] | VuePropertyMeta['schema'][]): PropSchema[] {
  const schemas = Array.isArray(schema) ? schema : [schema]
  return schemas.flatMap((schema) => {
    for (const resolver of propResolvers) {
      const result = resolver.schema.safeParse(schema)
      if (result.success) {
        const propType = { schema: result.data, inputType: resolver.inputType, type: result.data?.type ?? result.data }

        if (propType.inputType === 'object') {
          const nestedSchema: Record<string, VuePropertyMeta> = propType.schema.schema
          propType.schema.schema = Object.entries(nestedSchema).reduce((acc, [key, sch]) => {
            acc[key] = inferPropTypes(sch)
            return acc
          }, {} as Record<string, PropertyType>)
        }

        if (propType.inputType === 'array') {
          const nestedSchema: VuePropertyMeta['schema'][] = propType.schema.schema
          propType.schema.schema = nestedSchema.flatMap(sch => inferSchemaType(sch), {} as any)
          // Ignore the array if the item schema cannot be resolved
          if (!propType.schema.schema?.length) return []
        }

        return propType
      }
    }

    if (typeof schema === 'string') return []

    if (schema?.kind === 'enum' && schema.schema) {
      const enumSchemas = typeof schema.schema === 'object' ? Object.values(schema.schema) : schema.schema
      return enumSchemas.flatMap(inferSchemaType)
    }

    return []
  })
}
