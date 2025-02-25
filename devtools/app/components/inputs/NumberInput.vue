<script setup lang="ts">
import type { NumberInputSchema } from '#module/runtime/server/services/infer'

defineProps<{ schema: NumberInputSchema }>()
const modelValue = defineModel<number>()
</script>

<template>
  <UInput
    v-model.number="modelValue"
    type="number"
    class="min-w-56"
  />
</template>
