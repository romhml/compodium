<script setup lang="ts">
defineProps<{
  /**
   This prop has a description with `backticks`
   */
  date?: Date
  requiredDate: Date
}>()

defineEmits([])
</script>

<template>
  <div
    class="px-4 py-2 border rounded"
  >
    {{ date }}
  </div>
</template>
