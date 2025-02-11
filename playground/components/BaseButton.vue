<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  variant: string
  foo: boolean
}>(), { label: 'Click me!' })

defineEmits([])
</script>

<template>
  <button> {{ label }} </button>
</template>
