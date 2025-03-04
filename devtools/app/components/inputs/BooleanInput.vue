<script setup lang="ts">
import type { BooleanInputSchema } from '#module/runtime/server/services/infer'

defineProps<{ schema: BooleanInputSchema }>()
</script>

<template>
  <USwitch class="mt-1.5" />
</template>
