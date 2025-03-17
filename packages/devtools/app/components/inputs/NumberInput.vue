<script setup lang="ts">
import type { NumberInputSchema } from '@compodium/core'

defineProps<{ schema: NumberInputSchema }>()
</script>

<template>
  <UInputNumber
    class="min-w-56"
    orientation="vertical"
  />
</template>
