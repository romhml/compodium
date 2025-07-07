<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    items: ['Option 1', 'Option 2', 'Option 3']
  }
})
</script>

<template>
  <USelectMenu class="w-48" />
</template>
