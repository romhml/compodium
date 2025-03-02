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
import { createReusableTemplate } from '@vueuse/core'

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
const props = defineProps<{ name: string, schema: PropSchema[], description?: string, disabled?: boolean, collapsible?: boolean, defaultOpen?: boolean }>()
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

const open = defineModel<boolean>('open')
const isObject = computed(() => currentInput.value?.inputType === 'object')

const [DefineSelect, ReuseSelect] = createReusableTemplate()
const [DefineInput, ReuseInput] = createReusableTemplate()
const [DefineLabel, ReuseLabel] = createReusableTemplate()
const [DefineDescription, ReuseDescription] = createReusableTemplate()
</script>

<template>
  <div class="w-full">
    <DefineSelect>
      <USelect
        v-if="schema?.length > 1"
        v-model="currentType"
        variant="none"
        size="sm"
        :items="schema"
        label-key="type"
        value-key="type"
        :trailing-icon="undefined"
        class="font-medium text-ellipsis truncate max-w-50 py-0.5 px-1.5 font-mono bg-(--ui-bg-elevated)/50 border border-(--ui-border)"
        @update:model-value="modelValue = undefined"
      />
    </DefineSelect>

    <DefineInput>
      <component
        :is="currentInput.component"
        v-if="!disabled && currentInput"
        v-model="modelValue"
        :schema="currentInput.schema"
      />
    </DefineInput>

    <DefineLabel>
      <p class="truncate text-ellipsis font-mono font-semibold">
        {{ name }}
      </p>
    </DefineLabel>
    <DefineDescription>
      <!-- eslint-disable vue/no-v-html -->
      <p
        v-if="description"
        class="text-(--ui-text-muted) text-sm"
        v-html="description"
      />
    </DefineDescription>

    <template v-if="collapsible || isObject">
      <UCollapsible
        v-model:open="open"
        :default-open="defaultOpen || isObject"
        :ui="{ root: 'w-full border border-(--ui-border) rounded-md', content: !isObject ? 'p-4' : '' }"
      >
        <UButton
          class="rounded-b-none text-sm py-1 flex justify-between w-full"
          color="neutral"
          size="sm"
          variant="ghost"
          block
          :ui="{ base: 'py-1.5 hover:bg-(--ui-bg-elevated)/50', trailingIcon: 'group-data-[state=open]:rotate-180 transition duration-200' }"
        >
          <ReuseLabel class="text-sm" />
          <ReuseSelect />
        </UButton>
        <template #content>
          <ReuseInput :collapsible="collapsible" />
        </template>
      </UCollapsible>
      <div class="mt-2">
        <ReuseDescription />
      </div>
    </template>
    <UFormField
      v-else
      :name="name"
      class="w-full"
      :class="{ 'opacity-70 cursor-not-allowed': disabled || !currentInput }"
      :ui="{ label: 'w-full', description: 'mb-2' }"
    >
      <template #label>
        <div class="flex w-full justify-between gap-2">
          <ReuseLabel />
          <ReuseSelect />
        </div>
      </template>

      <template #description>
        <ReuseDescription />
      </template>

      <ReuseInput />
    </UFormField>
  </div>
</template>
