<script setup lang="ts">
defineProps<{ label?: string }>()
extendCompodiumMeta({ defaultProps: { active: false } })
</script>

<template>
  <div>{{ label }}</div>
</template>
