<script setup lang="ts">
import CompodiumWelcome from '../../src/components/CompodiumWelcome.vue'

extendCompodiumMeta({ defaultProps: { bounceIt: true } })
</script>

<template>
  <CompodiumWelcome />
</template>
