<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    text: 'Tooltip'
  }
})
</script>

<template>
  <UTooltip v-bind="$attrs">
    <UButton
      label="Show Tooltip"
      color="neutral"
      variant="subtle"
    />
  </UTooltip>
</template>
