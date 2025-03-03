<script setup lang="ts">
import type { ObjectInputSchema } from '#module/runtime/server/services/infer'

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
        else modelValue = { ...modelValue, [attr.name]: value }
      }"
    />
  </CollapseContainer>
</template>
