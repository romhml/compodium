<script lang="ts">
import type { PropInputType, PropSchema } from '#module/types'
import BooleanInput from '../components/inputs/BooleanInput.vue'
import StringInput from '../components/inputs/StringInput.vue'
import NumberInput from '../components/inputs/NumberInput.vue'
import StringEnumInput from '../components/inputs/StringEnumInput.vue'
import ObjectInput from '../components/inputs/ObjectInput.vue'
import ArrayInput from '../components/inputs/ArrayInput.vue'
import PrimitiveArrayInput from '../components/inputs/PrimitiveArrayInput.vue'
import DateInput from '../components/inputs/DateInput.vue'

const inputTypes: Record<PropInputType, Component> = {
  array: ArrayInput,
  object: ObjectInput,
  boolean: BooleanInput,
  string: StringInput,
  number: NumberInput,
  primitiveArray: PrimitiveArrayInput,
  date: DateInput,
  stringEnum: StringEnumInput
}
</script>

<script setup lang="ts">
const props = defineProps<{ name?: string, schema: PropSchema[], defaultValue?: any, description?: string, disabled?: boolean }>()
const modelValue = defineModel<any>()

const currentType = ref()
const currentInput = computed<PropSchema & { component: Component } | null>(() => {
  const type = props.schema?.find(p => p.type === currentType.value)
  if (type) return {
    ...type, component: (inputTypes as any)[type.inputType]
  }
  return null
})

function resetEmptyValue() {
  if (!modelValue.value || modelValue.value === '') {
    if (props.defaultValue) {
      modelValue.value = props.defaultValue
    }
  }
}

function inferDefaultInput(value?: any, types?: PropSchema[]): PropSchema | undefined {
  if (!value) return
  const valueType = typeof value
  return types?.find((t) => {
    if (valueType === t.schema) return t

    const nestedSchema = (t.schema as any).schema
    if (typeof nestedSchema === 'object' && typeof value === 'object') {
      return Object.keys(value).every(k => !!nestedSchema[k])
    }
  })
}

// TODO: Move this part server side to improve performances
watch(() => props.schema, () => {
  if (!props.schema) return
  currentType.value = inferDefaultInput(modelValue.value, props.schema)?.type ?? props.schema?.[0]?.type
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
      :class="{ 'opacity-70 cursor-not-allowed': disabled || !currentInput }"
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
        :is="currentInput.component"
        v-if="!disabled && currentInput"
        v-model="modelValue"
        :schema="currentInput.schema"
      />
    </UFormField>

    <USelect
      v-if="schema?.length > 1"
      v-model="currentType"
      variant="none"
      :items="schema"
      label-key="type"
      value-key="type"
      class="absolute top-2 right-5 max-w-xs font-mono font-medium"
      @update:model-value="modelValue = undefined"
    />
  </div>
</template>
