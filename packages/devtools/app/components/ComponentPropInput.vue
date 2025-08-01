<script lang="ts">
import type { PropInputType, PropSchema } from '@compodium/core'
import BooleanInput from '../components/inputs/BooleanInput.vue'
import StringInput from '../components/inputs/StringInput.vue'
import NumberInput from '../components/inputs/NumberInput.vue'
import StringEnumInput from '../components/inputs/StringEnumInput.vue'
import ObjectInput from '../components/inputs/ObjectInput.vue'
import ArrayInput from '../components/inputs/ArrayInput.vue'
import PrimitiveArrayInput from '../components/inputs/PrimitiveArrayInput.vue'
import DateInput from '../components/inputs/DateInput.vue'
import IconInput from '../components/inputs/IconInput.vue'
import { createReusableTemplate } from '@vueuse/core'

const inputTypes: Record<PropInputType, Component> = {
  icon: IconInput,
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
const props = defineProps<{ name?: string, schema: PropSchema[], description?: string, disabled?: boolean, inline?: boolean, hideLabel?: boolean }>()

const items = computed(() => props.schema?.map(s => s.type))
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

function clearValue() {
  modelValue.value = undefined
}

const description = computed(() => {
  return props.description?.replace(/`([^`]+)`/g, '<code class="text-xs font-medium bg-elevated px-1 py-0.5 rounded">$1</code>')
})

const isArray = computed(() => currentInput.value?.inputType === 'array')

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
        :items="items"
        variant="none"
        size="sm"
        :trailing-icon="undefined"
        class="font-medium text-ellipsis truncate max-w-50 py-0.5 px-1.5 font-mono bg-elevated/50 border border-default"
        @update:model-value="clearValue()"
      />
    </DefineSelect>

    <DefineInput>
      <component
        :is="currentInput.component"
        v-if="currentInput"
        v-model="modelValue"
        class="w-full"
        :schema="currentInput.schema"
        :name="name"
        :disabled="disabled"
      />
      <slot name="actions">
        <UButton
          v-if="currentInput?.component && modelValue !== undefined && currentInput?.inputType !== 'boolean'"
          variant="outline"
          color="neutral"
          icon="i-lucide-x"
          size="sm"
          class="p-2"
          square
          @click="clearValue()"
        />
      </slot>
    </DefineInput>

    <DefineLabel>
      <p
        v-if="name && !hideLabel"
        class="truncate text-ellipsis font-mono font-semibold"
      >
        {{ name }}
      </p>
      <span v-else />
    </DefineLabel>
    <DefineDescription>
      <!-- eslint-disable vue/no-v-html -->
      <p
        v-if="description"
        class="text-muted text-sm"
        v-html="description"
      />
    </DefineDescription>

    <template v-if="!inline || isArray">
      <UFormField
        :name="name"
        class=""
        :class="{ 'opacity-70 cursor-not-allowed': disabled || !currentInput }"
        :label="name"
        :ui="{ label: 'w-full flex gap-2 justify-between mb-1', description: 'mb-2', container: 'w-full', wrapper: name || schema?.length > 1 ? '' : 'hidden' }"
      >
        <template #label>
          <ReuseLabel />
          <ReuseSelect />
        </template>

        <ReuseDescription />

        <div class="flex gap-2 justify-center">
          <ReuseInput />
        </div>
      </UFormField>
    </template>

    <template v-else>
      <div class="flex justify-end mb-2">
        <ReuseSelect />
      </div>
      <UFormField
        :name="name"
        class="w-full flex gap-4"
        :class="{ 'opacity-70 cursor-not-allowed': disabled || !currentInput }"
        :label="name"
        :ui="{ label: 'font-sans my-auto w-32', description: 'mb-2', container: 'mt-0 w-full', wrapper: name ? '' : 'hidden' }"
      >
        <template #label>
          <ReuseLabel
            v-if="name"
            class="mt-1.5"
          />
        </template>
        <div class="flex w-full gap-2">
          <ReuseInput />
        </div>
      </UFormField>
      <div class="mt-2">
        <ReuseDescription />
      </div>
    </template>
  </div>
</template>
