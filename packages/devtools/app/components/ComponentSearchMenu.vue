<script setup lang="ts">
import type { Component, ComponentCollection, ComponentExample } from '@compodium/core'
import { onKeyStroke } from '@vueuse/core'

const props = defineProps<{ collections: ComponentCollection[] }>()
const modelValue = defineModel<Component | ComponentExample>()

const modalState = ref(false)

const items = computed(() =>
  props.collections?.map(col => ({
    id: col.name,
    ...col,
    label: col.name,
    items: col.components.flatMap((comp) => {
      const label = comp?.isExample ? comp.pascalName.replace(/Example$/, '') : comp.pascalName
      return [
        {
          ...comp,
          id: comp.pascalName,
          label
        },
        ...(comp.examples?.map(e => ({
          ...e,
          id: e.pascalName,
          label,
          suffix: e.pascalName.replace(label, '').replace(/^Example/, '')
        })) ?? [])
      ]
    })
  })).filter(col => col.items?.length > 0)
)

onKeyStroke(['b'], (e) => {
  if (e.metaKey || e.ctrlKey) {
    modalState.value = !modalState.value
  }
}, { dedupe: true, eventName: 'keydown' })
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
        class="h-80"
        @update:model-value="modalState = false"
      />
    </template>
  </UModal>
</template>
