<script setup lang="ts">
import type { NumberInputSchema } from 'compodium'

defineProps<{ schema: NumberInputSchema }>()
</script>

<template>
  <UInputNumber class="min-w-56" />
</template>
