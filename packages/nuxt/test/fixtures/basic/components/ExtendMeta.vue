<script setup lang="ts">
defineProps<{ foo: string }>()

extendCompodiumMeta({
  defaultProps: {
    foo: 'bar',
    bool: true,
    num: 123,
    nested: {
      bat: 'baz'
    },
    array: [{ foo: 'bar' }, 'hello']
  }
})
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
