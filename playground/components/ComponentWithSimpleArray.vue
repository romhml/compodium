<script setup lang="ts">
defineProps<{
  /**
   This prop has a description with `backticks`
   */
  stringArray?: string[]
  numberArray: number[]
  enumArray: Array<'value' | 'sakjd' | 'kasjdsa'>
}>()

defineEmits([])
</script>

<template>
  <div
    class="px-4 py-2 border rounded"
  >
    {{ stringArray }}
  </div>
</template>
