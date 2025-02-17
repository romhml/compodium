<script setup lang="ts">
import type { PropertyMeta } from 'vue-component-meta'
import { inferPropTypes, inferDefaultInput, type InferPropTypeResult } from '../helpers/infer'

const props = defineProps<{ name?: string, schema: PropertyMeta['schema'] | PropertyMeta['schema'][], defaultValue?: any, description?: string, disabled?: boolean }>()
const modelValue = defineModel<any>()

const currentType = ref()
const propTypes = shallowRef<InferPropTypeResult<any>[]>()
const propType = computed(() => propTypes.value?.find(p => p.type === currentType.value))

function resetEmptyValue() {
  if (!modelValue.value || modelValue.value === '') {
    if (props.defaultValue) {
      modelValue.value = props.defaultValue
    }
  }
}

watch(() => props.schema, () => {
  if (!props.schema) return
  propTypes.value = inferPropTypes(props.schema)
  currentType.value = inferDefaultInput(modelValue.value, propTypes.value)?.type ?? propTypes.value?.[0]?.type
  resetEmptyValue()
}, { immediate: true })

const description = computed(() => {
  return props.description?.replace(/`([^`]+)`/g, '<code class="font-medium bg-[var(--ui-bg-elevated)] px-1 py-0.5 rounded">$1</code>')
})
</script>

<template>
  <div class="relative">
    <UFormField
      :name="name"
      class="w-full"
      :ui="{ wrapper: 'mb-2' }"
      :class="{ 'opacity-70 cursor-not-allowed': disabled }"
    >
      <template #label>
        <div>
          <p
            v-if="name"
            class="font-mono font-bold px-1.5 py-0.5 border border-[var(--ui-border-accented)] border-dashed rounded bg-[var(--ui-bg-elevated)]"
          >
            {{ name }}
          </p>
        </div>
      </template>

      <template #description>
        <!-- eslint-disable vue/no-v-html -->
        <p
          v-if="description"
          class="text-neutral-600 dark:text-neutral-400 mt-1"
          v-html="description"
        />
      </template>
      <component
        :is="propType.component"
        v-if="!disabled && propType"
        v-model="modelValue"
        :schema="propType.parsedSchema"
      />
    </UFormField>

    <USelect
      v-if="propTypes && propTypes.length > 1"
      v-model="currentType"
      variant="none"
      :items="propTypes"
      label-key="type"
      value-key="type"
      class="absolute top-2 right-5 max-w-xs"
      @update:model-value="modelValue = undefined"
    />
  </div>
</template>
