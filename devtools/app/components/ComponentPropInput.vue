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
const props = defineProps<{ name?: string, schema: PropSchema[], description?: string, disabled?: boolean, arrayItem?: boolean }>()
const modelValue = defineModel<any>()

const currentType = ref()
watch(() => props.schema, () => {
  if (!props.schema) return
  currentType.value = inferDefaultInput(modelValue.value, props.schema)?.type ?? props.schema?.[0]?.type
}, { immediate: true })

const currentInput = computed<PropSchema & { component: Component } | null>(() => {
  const type = props.schema?.find(p => p.type === currentType.value)
  if (type) return {
    ...type, component: (inputTypes as any)[type.inputType]
  }
  return null
})

console.log('val', props.schema, currentInput.value)

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

const description = computed(() => {
  return props.description?.replace(/`([^`]+)`/g, '<code class="text-xs font-medium bg-[var(--ui-bg-elevated)] px-1 py-0.5 rounded">$1</code>')
})
</script>

<template>
  <div class="relative">
    <UFormField
      :name="name"
      class="w-full"
      :class="{ 'opacity-70 cursor-not-allowed': disabled || !currentInput }"
      :ui="{ label: 'w-full' }"
    >
      <template #label>
        <div class="flex w-full justify-between gap-2 mb-2">
          <p
            v-if="name"
            class="flex-none font-mono font-semibold px-1.5 py-0.5 border border-(--ui-border-accented)/50 rounded bg-[var(--ui-bg-elevated)]"
          >
            {{ name }}
          </p>
          <span v-else />

          <USelect
            v-if="schema?.length > 1"
            v-model="currentType"
            variant="none"
            :items="schema"
            label-key="type"
            value-key="type"
            trailing-icon=""
            class="max-w-50 py-0.5 font-mono bg-(--ui-bg-elevated)/50 border border-(--ui-border)"
            @update:model-value="modelValue = undefined"
          />
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
        :array-item="arrayItem"
      />
    </UFormField>
  </div>
</template>
