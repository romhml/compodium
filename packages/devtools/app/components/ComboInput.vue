<script lang="ts">
export type ComboItem = {
  value: string
  label: string
  options: string[]
}
</script>

<script setup lang="ts">
defineProps<{ items: ComboItem[] }>()
const modelValue = defineModel<Partial<[ComboItem, ComboItem]>>()

function updateValue(item: ComboItem) {
  modelValue.value ??= []

  const itemIndex = modelValue.value?.findIndex(i => i?.value === item.value)
  if (itemIndex > -1) {
    modelValue.value[itemIndex] = undefined
    modelValue.value = [...modelValue.value]
    return
  }

  if (modelValue.value[0]) {
    modelValue.value[1] = item
  } else {
    modelValue.value[0] = item
  }
  modelValue.value = [...modelValue.value]
}
</script>

<template>
  <UPopover
    :ui="{ content: 'flex flex-wrap justify-center p-2 max-w-64' }"
    mode="hover"
  >
    <UButton
      variant="link"
      color="neutral"
      class="relative flex gap-2"
    >
      <div class="w-20 text-right">
        <p
          v-if="modelValue?.[0]"
          class="truncate"
        >
          {{ modelValue?.[0]?.label }}
        </p>
        <p
          v-else
          class="opacity-80"
        >
          Combo
        </p>
      </div>

      <UIcon
        name="lucide:x"
        class="size-4"
      />

      <div class="w-20 text-left">
        <p
          v-if="modelValue?.[1]"
          class="truncate"
        >
          {{ modelValue?.[1]?.label }}
        </p>
        <p
          v-else
          class="opacity-80"
        >
          Combo
        </p>
      </div>
    </UButton>
    <template #content>
      <UButton
        v-for="item in items"
        :key="item.value"
        :label="item.label"
        color="neutral"
        variant="ghost"
        :trailing-icon="modelValue?.find(i => i?.value === item.value) ? 'lucide:check' : ''"
        @click="updateValue(item)"
      >
        <template #trailing>
          <UIcon
            v-if="modelValue?.find(i => i?.value === item.value)"
            name="lucide:check"
            class="size-4"
          />
          <span
            v-else
            class="size-4"
          />
        </template>
      </UButton>
    </template>
  </UPopover>
</template>
