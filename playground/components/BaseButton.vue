<script setup lang="ts">
defineProps<{
  label: string
  variant: string
  variant2: string
}>()

defineEmits([])
</script>

<template>
  <button> {{ label }} false </button>
</template>
