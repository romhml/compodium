<script setup lang="ts">
import CompodiumWelcome from '../../src/components/CompodiumWelcome.vue'

extendCompodiumMeta({ defaultProps: { shakeIt: true } })
</script>

<template>
  <CompodiumWelcome />
</template>
