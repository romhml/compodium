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
  <USlideover
    ref="modal"
    v-model:open="modalState"
    class="rounded"
    :close="false"
    :ui="{ body: 'p-0 sm:p-0', header: 'p-4 sm:p-4' }"
    :overlay="false"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          @click="modalState = false"
        />
        <p class="font-bold">
          Edit {{ name }}
        </p>
      </div>
    </template>
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
  </USlideover>
</template>
