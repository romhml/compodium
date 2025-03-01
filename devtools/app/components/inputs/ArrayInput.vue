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
      class="relative mb-2 w-full flex gap-2"
    >
      <UCollapsible :ui="{ root: 'border border-(--ui-border) w-full rounded-md' }">
        <UButton
          :label="'Value ' + (index + 1)"
          class="group rounded-b-none border-(--ui-border) font-semibold"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-chevron-down"
          block
          :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition duration-200' }"
        />

        <template #content>
          <ComponentPropInput
            :model-value="value"
            :schema="schema.schema"
            array-item
            class="px-4 pb-4 pt-2"
            @update:model-value="(val) => updateValue(index, val)"
          />
        </template>
      </UCollapsible>

      <div>
        <UButton
          variant="outline"
          color="neutral"
          icon="lucide:x"
          size="sm"
          square
          class="p-2"
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
