<script lang="ts">
import { z } from 'zod'

export const objectInputSchema = z.object({
  kind: z.literal('object'),
  schema: z.record(z.string(), z.any()),
  type: z.string()
})

export type ObjectInputSchema = z.infer<typeof objectInputSchema>
</script>

<script setup lang="ts">
const props = defineProps<{ schema: ObjectInputSchema }>()

const modelValue = defineModel<Record<string, any>>({})

const attrs = computed(() => {
  return Object.values(props.schema.schema)
})
</script>

<template>
  <CollapseContainer>
    <ComponentPropInput
      v-for="attr in attrs"
      :key="attr.name"
      class="border-b last:border-b-0 border-[var(--ui-border)] p-4"
      :model-value="modelValue?.[attr.name]"
      :schema="attr.schema"
      :name="attr.name"
      :description="attr.description"
      :default-value="attr.default"
      @update:model-value="(value: any) => {
        if (!modelValue) modelValue ||= {}
        else modelValue[attr.name] = value
      }"
    />
  </CollapseContainer>
</template>
