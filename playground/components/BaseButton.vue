<script setup lang="ts">
withDefaults(defineProps<{
  /**
   This prop has a description with `backticks`
   */
  label?: string
  variant?: 'outline' | 'solid'
  foo?: boolean
  obj?: { foo: string, bar: number }
  arr?: string[]
  arrObj?: { baz: string }[]
}>(), { label: 'Click me!', variant: 'outline', arr: () => ['bar', 'baz'], obj: () => ({ foo: 'bar', bar: 123 }) })

defineEmits([])
</script>

<template>
  <button> {{ label }} </button>
</template>
