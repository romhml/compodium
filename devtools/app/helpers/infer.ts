import type { PropertyMeta } from 'vue-component-meta'
import BooleanInput, { booleanInputSchema } from '../components/inputs/BooleanInput.vue'
import StringInput, { stringInputSchema } from '../components/inputs/StringInput.vue'
import NumberInput, { numberInputSchema } from '../components/inputs/NumberInput.vue'
import StringEnumInput, { stringEnumInputSchema } from '../components/inputs/StringEnumInput.vue'
import ObjectInput, { objectInputSchema } from '../components/inputs/ObjectInput.vue'
import ArrayInput, { arrayInputSchema } from '../components/inputs/ArrayInput.vue'
import type { ZodSchema } from 'zod'
import type { Component as VueComponent } from 'vue'

export type PropResolver<T extends ZodSchema> = {
  id: string
  schema: T
  component: VueComponent
  // TODO: Integrate default value generator from app config.
  // Also allow users to configure which inputs to use for a prop.
  // fake?: (prop: PropertyMeta, parsedSchema: z.output<T>) => any
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
    id: 'array',
    schema: arrayInputSchema,
    component: ArrayInput
  }
]

export function inferPropType<T extends ZodSchema>(schema: PropertyMeta['schema']): { parsedSchema: PropertyMeta['schema'], resolver: PropResolver<T> } | undefined {
  // Return the first input in the list of available inputs that matches the schema.
  for (const resolver of propResolvers) {
    const result = resolver.schema.safeParse(schema)
    if (result.success) {
      // Returns the output from zod to get the transformed output.
      // It only includes attributes defined in the zod schema.
      return { parsedSchema: result.data as PropertyMeta['schema'], resolver: resolver }
    }
  }

  if (typeof schema === 'string') return

  // If the schema is a complex enum or array return the first nested schema that matches an input.
  if (schema.kind === 'enum' && schema.schema) {
    const enumSchemas = typeof schema.schema === 'object' ? Object.values(schema.schema) : schema.schema
    for (const enumSchema of enumSchemas) {
      const result = inferPropType(enumSchema)
      if (result) return result
    }
  }
}

export function hash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    hash = (hash << 5) - hash + charCode
    hash |= 0
  }
  return hash
}
