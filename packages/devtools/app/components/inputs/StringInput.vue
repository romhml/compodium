<script setup lang="ts">
import type { StringEnumInputSchema } from '@compodium/core'

defineProps<{ schema: StringEnumInputSchema }>()
</script>

<template>
  <UTextarea
    :rows="1"
    :maxrows="8"
    autoresize
    :ui="{ base: 'resize-none' }"
  />
</template>
