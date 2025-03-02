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
  openedItem.value = modelValue.value?.length - 1
}

function updateValue(index: number, value: any) {
  if (!modelValue.value) return
  modelValue.value[index] = value
  modelValue.value = [...modelValue.value]
}

const openedItem = ref<number | null>(0)

function onUpdateOpen(index: number, value?: boolean) {
  if (!value && openedItem.value === index) openedItem.value = null
  if (value) openedItem.value = index
}
</script>

<template>
  <div>
    <div
      v-for="value, index in modelValue"
      :key="index"
      class="relative w-full flex gap-2"
    >
      <ComponentPropInput
        :model-value="value"
        :schema="schema.schema"
        :name="'value ' + (index + 1)"
        array-item
        collapsible
        :open="openedItem === index"
        @update:model-value="(val) => updateValue(index, val)"
        @update:open="(val) => onUpdateOpen(index, val)"
      />

      <div>
        <UButton
          variant="outline"
          color="neutral"
          icon="lucide:x"
          size="sm"
          square
          class="p-2.25"
          @click="removeArrayItem(index)"
        />
      </div>
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
