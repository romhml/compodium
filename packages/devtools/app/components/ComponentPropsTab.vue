<script setup lang="ts">
import type { PropertyMeta } from '@compodium/core'
import type { ComponentMeta } from 'vue-component-meta'
import { useFuse } from '@vueuse/integrations/useFuse'

const props = defineProps<{
  meta?: ComponentMeta
  defaultValue?: Record<string, any>
  disabled?: string[]
}>()

const modelValue = defineModel<Record<string, any>>({ default: () => ({}) })
const componentProps = computed(() => props.meta?.props ?? [])

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

watch(() => props.meta, () => propsSearchTerm.value = '')

const isRotated = ref(false)
function onResetState() {
  if (isRotated.value) return
  setTimeout(() => isRotated.value = false, 500)
  isRotated.value = true
  modelValue.value = structuredClone(props.defaultValue ?? {})
}
</script>

<template>
  <template v-if="componentProps.length">
    <div class="bg-default p-0.5 border-y border-default sticky top-0 z-1 flex gap-0.5">
      <UInput
        v-model="propsSearchTerm"
        placeholder="Search props..."
        icon="lucide:search"
        variant="none"
        class="w-full ml-1"
      />
      <UTooltip
        text="Reset props"
        :content="{ side: 'left' }"
        title="JSON Editor"
      >
        <USlideover
          ref="modal"
          class="rounded"
          close-icon="i-lucide-arrow-right"
          :ui="{
            body: 'p-0 sm:p-0',
            header: 'px-4 py-1.5 sm:py-1.5 sm:px-4 min-h-8 flex justify-between',
            close: 'top-1'
          }"
          :overlay="false"
          title="JSON Editor"
        >
          <template #close>
            <UButton
              size="sm"
              icon="i-lucide-arrow-right"
              color="neutral"
              variant="ghost"
            />
          </template>
          <UButton
            icon="lucide:braces"
            variant="link"
            color="neutral"
            size="sm"
          />
          <template #body>
            <JsonEditor
              v-model="modelValue"
              class="h-full"
            />
          </template>
        </USlideover>
        <UButton
          icon="lucide:rotate-cw"
          variant="link"
          color="neutral"
          class="rounded-full"
          size="sm"
          :class="{ 'animate-rotate': isRotated }"
          @click="onResetState()"
        />
      </UTooltip>
    </div>
    <div
      v-for="prop in componentProps"
      v-show="visibleProps.has(prop.name)"
      :key="prop.name"
      class="grow px-3 py-2 border-b border-default"
    >
      <PropInput
        :model-value="modelValue[prop.name]"
        :schema="prop.schema"
        :name="prop.name"
        :description="prop.description"
        inline
        class="p-3 rounded"
        :disabled="!!disabled?.find(d => d === prop.name)"
        @update:model-value="(value) => modelValue = { ...modelValue, [prop.name]: value }"
      />
    </div>
  </template>
  <div
    v-if="!componentProps?.length || !visibleProps?.size"
    class="text-dimmed text-center p-8"
  >
    <UIcon
      name="lucide:bird"
      size="20"
    />
    <p>No props found</p>
  </div>
</template>
