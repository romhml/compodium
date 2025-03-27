<script setup lang="ts">
const props = defineProps<{
  events: { name: string, data?: any }[]
}>()

const currentEventIndex = ref(0)
const event = computed(() => props.events?.[currentEventIndex.value])

function isJsonable(value: any) {
  return typeof value === 'object' || Array.isArray(value)
}

watch(() => props.events?.length, () => currentEventIndex.value = 0)
</script>

<template>
  <template v-if="events?.length">
    <div class="flex flex-col justify-between h-full">
      <div class="p-2 flex flex-col overflow-y-scroll">
        <UButton
          v-for="e, index in events"
          :key="index"
          class="mb-1 w-full"
          variant="ghost"
          color="neutral"
          :active="currentEventIndex === index"
          active-variant="soft"
          @click="currentEventIndex = index"
        >
          {{ e.name }}
          <template v-if="e.data !== undefined">
            <span class="text-(--ui-text-dimmed)"> ⦁ </span>
            <span class="truncate text-(--ui-text-dimmed)">
              {{ isJsonable(e.data) ? JSON.stringify(e.data) : e.data }}
            </span>
          </template>
        </UButton>
      </div>
      <div
        v-if="event?.data !== undefined"
        class="shrink-0 min-h-20 max-h-1/2 border-t border-(--ui-border) p-4 bg-(--ui-bg-elevated)/50 overflow-y-scroll"
      >
        <JsonEditor
          v-if="isJsonable(event?.data)"
          :model-value="event?.data"
          readonly
        />
        <p
          v-else
          class="text-wrap break-all"
        >
          {{ event?.data }}
        </p>
      </div>
    </div>
  </template>
  <div
    v-else
    class="text-(--ui-text-dimmed) text-center p-8"
  >
    <UIcon
      name="lucide:squirrel"
      size="20"
    />
    <p>No events fired</p>
  </div>
</template>
