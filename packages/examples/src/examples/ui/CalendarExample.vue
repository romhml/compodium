<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
</script>

<template>
  <UCalendar :default-value="new CalendarDate(2025, 6, 8)" />
</template>
