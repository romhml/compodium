<script lang="ts">
import { z } from 'zod'

const primitiveSchema = z.enum(['number', 'string']).or(
  z.object({
    kind: z.literal('enum'),
    schema: z.array(z.string())
      .or(z.record(z.any(), z.string()).transform<string[]>(t => Object.values(t)))
      .transform<string[]>(t => t.filter(s => s !== 'undefined').map(s => s.trim().replaceAll(/["'`]/g, '')))
      .pipe(z.array(z.string()).min(1))
  }))

export const primitiveArrayInputSchema = z.object({
  kind: z.literal('array'),
  schema: z.array(z.any())
    .or(z.record(z.any(), primitiveSchema).transform(t => Object.values(t)))
    .transform(t => t.filter(s => s !== 'undefined')).pipe(z.array(primitiveSchema))
})

export type PrimitiveArrayInputSchema = z.infer<typeof primitiveArrayInputSchema>
</script>

<script setup lang="ts">
const props = defineProps<{
  schema: PrimitiveArrayInputSchema
}>()

const searchTerm = ref('')
const items = ref<string[]>([])
const modelValue = defineModel<any[]>({ default: [] })

const inputValue = computed({
  get() {
    return modelValue.value.map(v => v.toString())
  },
  set(value: string[]) {
    modelValue.value = props.schema?.schema[0] === 'number' ? value.map(Number) : value
  }
})

function onCreate(item: string) {
  items.value.push(item)
  inputValue.value = [...inputValue.value, item]
  searchTerm.value = ''
}
</script>

<template>
  <StringEnumInput
    v-if="typeof schema.schema[0] === 'object' && schema?.schema?.[0]?.kind === 'enum'"
    v-model="modelValue"
    multiple
    :schema="props.schema.schema[0] as any"
  />
  <UInputMenu
    v-else
    v-model="inputValue"
    v-model:search-term="searchTerm"
    multiple
    create-item
    no-portal
    :items="items"
    :ui="{ viewport: 'invisible', content: 'invisible' }"
    class="min-w-56"
    @create="onCreate"
  >
    <template #trailing>
      <span />
    </template>
  </UInputMenu>
</template>
