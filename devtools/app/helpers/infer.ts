import type { PropertyMeta } from 'vue-component-meta'
import BooleanInput, { booleanInputSchema } from '../components/inputs/BooleanInput.vue'
import StringInput, { stringInputSchema } from '../components/inputs/StringInput.vue'
import NumberInput, { numberInputSchema } from '../components/inputs/NumberInput.vue'
import StringEnumInput, { stringEnumInputSchema } from '../components/inputs/StringEnumInput.vue'
import ObjectInput, { objectInputSchema } from '../components/inputs/ObjectInput.vue'
import ArrayInput, { arrayInputSchema } from '../components/inputs/ArrayInput.vue'
import PrimitiveArrayInput, { primitiveArrayInputSchema } from '../components/inputs/PrimitiveArrayInput.vue'
import DateInput, { dateInputSchema } from '../components/inputs/DateInput.vue'
import type { ZodSchema, z } from 'zod'
import type { Component as VueComponent } from 'vue'

export type PropResolver<T extends ZodSchema> = {
  id: string
  schema: T
  component: VueComponent
}

// List of available inputs.
const propResolvers: PropResolver<any>[] = [
  {
    id: 'string',
    schema: stringInputSchema,
    component: StringInput
  },
  {
    id: 'number',
    schema: numberInputSchema,
    component: NumberInput
  },
  {
    id: 'boolean',
    schema: booleanInputSchema,
    component: BooleanInput
  },
  {
    id: 'date',
    schema: dateInputSchema,
    component: DateInput
  },
  {
    id: 'stringEnum',
    schema: stringEnumInputSchema,
    component: StringEnumInput
  },
  {
    id: 'object',
    schema: objectInputSchema,
    component: ObjectInput
  },
  {
    id: 'primitiveArray',
    schema: primitiveArrayInputSchema,
    component: PrimitiveArrayInput
  },
  {
    id: 'array',
    schema: arrayInputSchema,
    component: ArrayInput
  }
]

export type InferPropTypeResult<T extends ZodSchema> = PropResolver<T> & {
  type: string
  parsedSchema: z.output<T>
}

export function inferPropTypes<T extends ZodSchema>(schema: PropertyMeta['schema'] | PropertyMeta['schema'][]): InferPropTypeResult<T>[] {
  // Return the first input in the list of available inputs that matches the schema.

  const schemas = Array.isArray(schema) ? schema : [schema]

  return schemas.flatMap((schema) => {
    for (const resolver of propResolvers) {
      const result = resolver.schema.safeParse(schema)
      if (result.success) {
      // Returns the output from zod to get the transformed output.
      // It only includes attributes defined in the zod schema.
        return [{ parsedSchema: result.data, ...resolver, type: result.data?.type ?? result.data }]
      }
    }

    if (typeof schema === 'string') return []

    // If the schema is a complex enum or array return the first nested schema that matches an input.
    if (schema.kind === 'enum' && schema.schema) {
      const enumSchemas = typeof schema.schema === 'object' ? Object.values(schema.schema) : schema.schema
      return enumSchemas.flatMap(inferPropTypes<T>)
    }
    return []
  })
}

export function inferDefaultInput<T extends ZodSchema>(value: any, types: InferPropTypeResult<T>[]): InferPropTypeResult<T> | undefined {
  if (!value) return
  const valueType = typeof value
  return types.find((t) => {
    if (valueType === t.parsedSchema) return t
    if (typeof t.parsedSchema?.schema === 'object' && typeof value === 'object') {
      return Object.keys(value).every(k => !!t.parsedSchema.schema[k])
    }
  })
}
