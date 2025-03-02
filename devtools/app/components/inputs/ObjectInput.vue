<script setup lang="ts">
import type { ObjectInputSchema } from '#module/runtime/server/services/infer'
import type { PropertyMeta } from '@compodium/meta'
import { useFuse } from '@vueuse/integrations/useFuse.mjs'

const props = defineProps<{ schema: ObjectInputSchema, name: string }>()

const modelValue = defineModel<Record<string, any>>({})

const attrs = computed(() => {
  return Object.values(props.schema.schema)
})

const modalState = ref(false)

const componentProps = computed(() => attrs.value ?? [])
const propsSearchTerm = ref()

const { results: fuseResults } = useFuse<PropertyMeta>(propsSearchTerm, componentProps, {
  fuseOptions: {
    ignoreLocation: true,
    threshold: 0.1,
    keys: ['name', 'description']
  },
  matchAllWhenSearchEmpty: true
})

const visibleProps = computed(() => new Set(fuseResults.value?.map(result => result.item.name)))
</script>

<template>
  <USlideover
    ref="modal"
    v-model:open="modalState"
    class="rounded"
    :close="false"
    :ui="{ body: 'p-0 sm:p-0', header: 'px-4 py-1.5 sm:py-1.5 sm:px-4 min-h-0' }"
    :overlay="false"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          size="sm"
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
      <div class="bg-(--ui-bg) p-0.5 border-y border-(--ui-border) sticky top-0 z-1 flex gap-2">
        <UInput
          v-model="propsSearchTerm"
          placeholder="Search attributes..."
          icon="lucide:search"
          variant="none"
          class="w-full ml-1"
        />
      </div>
      <ComponentPropInput
        v-for="attr in attrs"
        v-show="visibleProps.has(attr.name)"
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
