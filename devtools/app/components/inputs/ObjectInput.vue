<script setup lang="ts">
import type { ObjectInputSchema } from '#module/runtime/server/services/infer'

const props = defineProps<{ schema: ObjectInputSchema, name: string }>()

const modelValue = defineModel<Record<string, any>>({})

const attrs = computed(() => {
  return Object.values(props.schema.schema)
})

const modalState = ref(false)
</script>

<template>
  <UModal
    ref="modal"
    v-model:open="modalState"
    close-icon="i-lucide-x"
    class="rounded"
    :title="'Edit ' + name"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:square-arrow-out-up-right"
      class="w-full"
      :ui="{ leadingIcon: 'size-4' }"
    >
      Edit
    </UButton>

    <template #body>
      <ComponentPropInput
        v-for="attr in attrs"
        :key="attr.name"
        :model-value="modelValue?.[attr.name]"
        :schema="attr.schema"
        :name="attr.name"
        :description="attr.description"
        :default-value="attr.default"
        inline
        class="px-6 py-4 not-last:border-b border-(--ui-border)"
        @update:model-value="(value: any) => {
          if (!modelValue) modelValue ||= {}
          else modelValue[attr.name] = value
        }"
      />
    </template>

    <template #footer>
      <div class="flex w-full justify-end">
        <UButton
          variant="outline"
          color="neutral"
          @click="modalState = false"
        >
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>
