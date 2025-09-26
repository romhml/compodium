<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    src: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg'
    },
    alt: 'Company Logo',
    width: 120,
    height: 40
  }
})
</script>

<template>
  <UColorModeImage />
</template>
