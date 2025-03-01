<script setup lang="ts">
import type { ObjectInputSchema } from '#module/runtime/server/services/infer'

const props = defineProps<{ schema: ObjectInputSchema, collapsible: boolean }>()

const modelValue = defineModel<Record<string, any>>({})

const attrs = computed(() => {
  return Object.values(props.schema.schema)
})
</script>

<template>
  <div
    class="border-(--ui-border)"
    :class="{ 'p-4 rounded-md border': !collapsible }"
  >
    <ComponentPropInput
      v-for="attr in attrs"
      :key="attr.name"
      :model-value="modelValue?.[attr.name]"
      :schema="attr.schema"
      :name="attr.name"
      :description="attr.description"
      :default-value="attr.default"
      class="not-last:mb-4"
      @update:model-value="(value: any) => {
        if (!modelValue) modelValue ||= {}
        else modelValue[attr.name] = value
      }"
    />
  </div>
</template>
