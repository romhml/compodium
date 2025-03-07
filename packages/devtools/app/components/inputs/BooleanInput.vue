<script setup lang="ts">
import type { BooleanInputSchema } from 'compodium'

defineProps<{ schema: BooleanInputSchema }>()
</script>

<template>
  <USwitch class="mt-1.5" />
</template>
