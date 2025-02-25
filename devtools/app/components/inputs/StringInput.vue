<script setup lang="ts">
import type { StringEnumInputSchema } from '#module/runtime/server/services/infer'

defineProps<{ schema: StringEnumInputSchema }>()
</script>

<template>
  <UInput class="min-w-56" />
</template>
