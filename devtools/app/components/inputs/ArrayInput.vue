<script setup lang="ts">
import type { ArrayInputSchema } from '#module/runtime/server/services/infer'

defineProps<{ schema: ArrayInputSchema }>()

const modelValue = defineModel<Array<any>>()

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
      class="relative mb-2 w-full flex gap-1.5"
    >
      <ComponentPropInput
        :model-value="value"
        :schema="schema.schema"
        :name="'Value ' + (index + 1)"
        array-item
        collapsible
        :default-open="true"
        @update:model-value="(val) => updateValue(index, val)"
      />

      <div>
        <UButton
          variant="outline"
          color="neutral"
          icon="lucide:x"
          size="sm"
          square
          class="p-2.5"
          @click="removeArrayItem(index)"
        />
      </div>
    </div>

    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      block
      class="justify-center"
      @click="addArrayItem()"
    >
      Add value
    </UButton>
  </div>
</template>
