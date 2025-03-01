<script setup lang="ts">
defineProps<{ foo: string }>()
extendCompodiumMeta('foo')
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
