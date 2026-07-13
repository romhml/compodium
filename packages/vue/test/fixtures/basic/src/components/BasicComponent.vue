<script setup lang="ts">
defineProps<{
  foo: string
  componentDefault?: boolean
  exampleDefault?: boolean
}>()

extendCompodiumMeta({ defaultProps: { componentDefault: true } })
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
