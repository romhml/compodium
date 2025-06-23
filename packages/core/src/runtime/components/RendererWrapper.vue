<template>
  <component
    :is="wrapper"
    v-if="wrapper"
  >
    <slot />
  </component>
  <slot v-else />
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  wrapper: Component
}>()
</script>
