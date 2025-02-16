<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div>
    {{ label ?? 'Hello world' }}
  </div>
</template>
