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
  >
    <UButton
      color="neutral"
      variant="outline"
      trailing-icon="lucide:square-arrow-out-up-right"
      block
    >
      Edit
    </UButton>
    <template #content>
      <UCard
        :ui="{
          body: 'p-0 sm:p-0 max-h-[60vh] overflow-y-scroll',
          footer: 'sticky top-0 bg-(--ui-bg) z-1 sm:px-6 p-4 border-none font-bold',
          header: 'sticky top-0 bg-(--ui-bg) z-1 sm:p-6 p-6 border-none font-bold'
        }"
      >
        <template #header>
          Edit {{ name }}
        </template>

        <ComponentPropInput
          v-for="attr in attrs"
          :key="attr.name"
          :model-value="modelValue?.[attr.name]"
          :schema="attr.schema"
          :name="attr.name"
          :description="attr.description"
          :default-value="attr.default"
          inline
          class="px-6 py-4 first:pt-0 not-last:border-b border-(--ui-border)"
          @update:model-value="(value: any) => {
            if (!modelValue) modelValue ||= {}
            else modelValue[attr.name] = value
          }"
        />

        <template #footer>
          <div class="flex justify-end">
            <UButton
              variant="outline"
              color="neutral"
              @click="modalState = false"
            >
              Close
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
