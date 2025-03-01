<script setup lang="ts">
import type { StringEnumInputSchema } from '#module/runtime/server/services/infer'

defineProps<{ schema: StringEnumInputSchema }>()
</script>

<template>
  <UTextarea
    class="min-w-56"
    :rows="1"
    :maxrows="8"
    autoresize
  />
</template>
