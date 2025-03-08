<script setup lang="ts">
import type { Component, ComponentCollection } from 'compodium'

const props = defineProps<{ collections: ComponentCollection[] }>()
const modelValue = defineModel<Component>()

const modalState = ref(false)

const items = computed(() =>
  props.collections?.map(col => ({
    ...col,
    items: col.components.map(comp => ({
      ...comp,
      id: comp.pascalName
    }))
  }))
)

defineShortcuts({
  meta_b: () => {
    modalState.value = true
  }
})
</script>

<template>
  <UModal v-model:open="modalState">
    <UTooltip
      text="Search"
      :kbds="['meta', 'b']"
      :content="{ side: 'right' }"
    >
      <UButton
        icon="lucide:search"
        color="neutral"
        variant="link"
      />
    </UTooltip>
    <template #content>
      <UCommandPalette
        v-model="modelValue"
        :groups="items"
        placeholder="Search component..."
        label-key="pascalName"
        class="h-80"
        @update:model-value="modalState = false"
      />
    </template>
  </UModal>
</template>
