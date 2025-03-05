<script setup lang="ts">
defineProps<{ foo: string }>()
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
