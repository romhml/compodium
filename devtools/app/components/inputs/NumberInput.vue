<script setup lang="ts">
import type { NumberInputSchema } from '#module/runtime/server/services/infer'

defineProps<{ schema: NumberInputSchema }>()
</script>

<template>
  <UInputNumber class="min-w-56" />
</template>
