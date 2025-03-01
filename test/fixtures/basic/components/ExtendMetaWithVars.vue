<script setup lang="ts">
defineProps<{ foo: string }>()

const foo = 'bar'

extendCompodiumMeta({
  defaultProps: {
    foo,
    bar: foo
  }
})
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
