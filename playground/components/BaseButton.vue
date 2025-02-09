<script setup lang="ts">
defineProps<{
  label: string
  variant: string
  foo: boolean
}>()

defineEmits([])
</script>

<template>
  <button> {{ label }} false </button>
</template>
