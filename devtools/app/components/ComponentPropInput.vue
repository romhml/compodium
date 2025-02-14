<script setup lang="ts">
import type { PropertyMeta } from 'vue-component-meta'
import { inferPropType } from '../helpers/infer'

const props = defineProps<{ meta: Partial<PropertyMeta>, disabled?: boolean }>()
const modelValue = defineModel<any>()

const propType = shallowRef()

function resetEmptyValue() {
  if (!modelValue.value || modelValue.value === '') {
    if (props.meta.default) {
      modelValue.value = props.meta.default
    }
  }
}

watchEffect(() => {
  if (!props.meta?.schema) return
  propType.value = inferPropType(props.meta.schema)
  resetEmptyValue()
})

const description = computed(() => {
  return props.meta.description?.replace(/`([^`]+)`/g, '<code class="font-medium bg-[var(--ui-bg-elevated)] px-1 py-0.5 rounded">$1</code>')
})
</script>

<template>
  <UFormField
    :name="meta?.name"
    class=""
    :ui="{ wrapper: 'mb-2' }"
    :class="{ 'opacity-70 cursor-not-allowed': !propType || disabled }"
  >
    <template #label>
      <p
        v-if="meta?.name"
        class="font-mono font-bold px-1.5 py-0.5 border border-[var(--ui-border-accented)] border-dashed rounded bg-[var(--ui-bg-elevated)]"
      >
        {{ meta?.name }}
      </p>
    </template>

    <template #description>
      <!-- eslint-disable vue/no-v-html -->
      <p
        v-if="meta.description"
        class="text-neutral-600 dark:text-neutral-400 mt-1"
        v-html="description"
      />
    </template>
    <component
      :is="propType.resolver.component"
      v-if="!disabled && propType"
      v-model="modelValue"
      :schema="propType.parsedSchema"
      @blur="resetEmptyValue()"
    />
  </UFormField>
</template>
