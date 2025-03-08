<script setup lang="ts">
import type { DateInputSchema } from 'compodium/types'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'

defineProps<{ schema: DateInputSchema }>()

const df = new DateFormatter('en-US', {
  dateStyle: 'medium'
})

const modelValue = defineModel<Date>()
const calendarDate = computed({
  get() {
    const date = modelValue.value ?? new Date()
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set(value) {
    modelValue.value = value.toDate(getLocalTimeZone())
  }
})
</script>

<template>
  <UPopover>
    <UButton
      color="neutral"
      variant="subtle"
      icon="i-lucide-calendar"
    >
      {{ modelValue ? df.format(modelValue) : 'Select a date' }}
    </UButton>

    <template #content>
      <UCalendar
        v-model="calendarDate"
        color="neutral"
        class="p-2"
      />
    </template>
  </UPopover>
</template>
