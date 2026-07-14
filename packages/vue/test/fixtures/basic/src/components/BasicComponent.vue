<script setup lang="ts">
defineProps<{
  foo: string
  componentDefault?: boolean
  exampleDefault?: boolean
}>()

extendCompodiumMeta({ defaultProps: { componentDefault: true }, combo: ['componentDefault'] })
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
