<script setup lang="ts">
import type { ArrayInputSchema } from '#module/runtime/server/services/infer'

defineProps<{ schema: ArrayInputSchema }>()

const modelValue = defineModel<Array<any>>({})

function removeArrayItem(index: number) {
  if (!modelValue.value) return
  modelValue.value.splice(index, 1)
}

function addArrayItem() {
  if (!modelValue.value) {
    modelValue.value = [null]
  } else {
    modelValue.value.push(null)
  }
}

function updateValue(index: number, value: any) {
  if (!modelValue.value) return
  modelValue.value[index] = value
  modelValue.value = [...modelValue.value]
}
</script>

<template>
  <div>
    <div
      v-for="value, index in modelValue"
      :key="index"
      class="relative"
    >
      <ComponentPropInput
        :model-value="value"
        :schema="schema.schema"
        @update:model-value="(val) => updateValue(index, val)"
      />

      <UButton
        variant="link"
        color="neutral"
        size="sm"
        icon="lucide:x"
        class="absolute top-2.5 right-1"
        @click="removeArrayItem(index)"
      />
    </div>

    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      block
      class="justify-center mt-4"
      @click="addArrayItem()"
    >
      Add value
    </UButton>
  </div>
</template>
