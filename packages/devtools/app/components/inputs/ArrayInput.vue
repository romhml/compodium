<script setup lang="ts">
import type { ArrayInputSchema } from '@compodium/core'

defineProps<{ schema: ArrayInputSchema }>()

const modelValue = defineModel<Array<any>>()

function removeArrayItem(index: number) {
  if (!modelValue.value) return
  modelValue.value.splice(index, 1)
  modelValue.value = [...modelValue.value]
}

function addArrayItem() {
  if (!modelValue.value) {
    modelValue.value = [null]
  } else {
    modelValue.value.push(null)
    modelValue.value = [...modelValue.value]
  }
  openedItem.value = modelValue.value?.length - 1
}

function updateValue(index: number, value: any) {
  if (!modelValue.value) return
  modelValue.value[index] = value
  modelValue.value = [...modelValue.value]
}

const openedItem = ref<number | null>(0)
</script>

<template>
  <div class="flex flex-col">
    <div
      v-for="value, index in modelValue"
      :key="index"
      class="relative w-full flex mb-2"
    >
      <ComponentPropInput
        :model-value="value"
        :schema="schema.schema"
        :name="'item ' + (index + 1)"
        hide-label
        @update:model-value="(val) => updateValue(index, val)"
      >
        <template #actions>
          <UButton
            variant="outline"
            color="neutral"
            icon="i-lucide-x"
            size="sm"
            class="p-2"
            square
            @click="removeArrayItem(index)"
          />
        </template>
      </ComponentPropInput>
    </div>

    <UButton
      icon="i-lucide-plus"
      color="neutral"
      variant="ghost"
      block
      @click="addArrayItem()"
    >
      Add value
    </UButton>
  </div>
</template>
