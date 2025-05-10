<script setup lang="ts">
import type { IconifyInfo } from '@iconify/types'
import { useDebounceFn, watchOnce } from '@vueuse/core'

const modelValue = defineModel<string>()

const { data: collections } = await useFetch<Record<string, IconifyInfo>>('/api/iconify', {
  baseURL: '/__compodium__',
  query: { q: '/collections' }
})

const collectionItems = computed(() => Object.entries(collections.value ?? {}).map(([key, value]) => ({ value: key, label: value.name })))
const selectedCollection = ref()
const searchTerm = ref()

watchOnce(collectionItems, () => {
  if (selectedCollection.value) return
  selectedCollection.value = collectionItems.value?.[0]
}, { immediate: true })

const { data: icons, refresh: fetchIcons } = await useAsyncData<string[] | undefined>(async () => {
  if (!selectedCollection.value) return

  if (searchTerm.value && searchTerm.value?.trim() !== '') {
    const search = await $fetch<{ icons: string[] }>('/api/iconify', {
      baseURL: '/__compodium__',
      query: { q: `/search?prefix=${selectedCollection.value.value}&query=${searchTerm.value}` }
    })

    return search?.icons ?? []
  }

  const collection = await $fetch<{ uncategorized: string[], categories: Record<string, string[]> }>('/api/iconify', {
    baseURL: '/__compodium__',
    query: { q: `/collection?prefix=${selectedCollection.value.value}` }
  })

  return [
    ...Object.values(collection?.categories ?? {}).flat(),
    ...(collection.uncategorized ?? [])
  ].map(icon => selectedCollection.value.value + ':' + icon)
})

const fetchIconsDebounced = useDebounceFn(fetchIcons, 300)

watch([icons, selectedCollection], () => page.value = 1)

const page = ref(1)
const visibleIcons = computed(() => {
  const result = icons.value?.slice(40 * (page.value - 1), page.value * 40)
  return result
})
</script>

<template>
  <UPopover>
    <UButtonGroup>
      <UButton
        :icon="modelValue"
        square
        color="neutral"
        variant="outline"
        class="w-8 h-8"
      />

      <UInput
        v-model="modelValue as string"
        @click="(e: MouseEvent) => e.stopPropagation()"
      />
    </UButtonGroup>
    <template #content>
      <div class="w-md p-4 h-[312px]">
        <div class="flex gap-2 mb-4">
          <USelectMenu
            v-model="selectedCollection"
            :items="collectionItems"
            class="w-full"
            @update:model-value="fetchIconsDebounced()"
          />
          <UInput
            v-model="searchTerm"
            class="w-full"
            icon="lucide:search"
            placeholder="Search icon..."
            @update:model-value="fetchIconsDebounced()"
          />
        </div>
        <div v-if="icons?.length">
          <div class="grid grid-cols-10 grid-rows-4 h-[196px]">
            <UButton
              v-for="icon in visibleIcons"
              :key="icon"
              :icon="icon"
              variant="ghost"
              color="neutral"
              square
              class="size-8"
              @click="modelValue = icon"
            />
          </div>
          <UPagination
            v-model:page="page"
            class="flex justify-center mt-2"
            variant="link"
            color="neutral"
            active-color="neutral"
            active-variant="outline"
            size="sm"
            :items-per-page="40"
            :total="icons?.length"
          />
        </div>
        <div
          v-else
          class="flex flex-col text-center justify-center w-full h-[196px] text-muted"
        >
          <UIcon
            name="lucide:x"
            class="mx-auto"
          />
          <p class="text-sm">
            No results
          </p>
        </div>
      </div>
    </template>
  </UPopover>
</template>
