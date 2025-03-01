<script setup lang="ts">
defineProps<{ foo: string }>()

const foo = 'bar'

extendCompodiumMeta('foo')
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
