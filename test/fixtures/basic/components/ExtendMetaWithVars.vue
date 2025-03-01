<script setup lang="ts">
defineProps<{ foo: string }>()

const baz = 'bar'

extendCompodiumMeta({
  defaultProps: {
    baz,
    bar: baz
  }
})
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
