<script setup lang="ts">
withDefaults(defineProps<{
  /**
   This prop has a description with `backticks`
   */
  label?: string
  variant?: 'outline' | 'solid'
  obj?: { foo: string, bar: number }
  arr?: string[]
  arrObj?: { baz: string }[]
}>(), { variant: 'outline', arr: () => ['bar', 'baz'], obj: () => ({ foo: 'bar', bar: 123 }) })

defineEmits([])
</script>

<template>
  <button
    :class="{ border: variant === 'outline' }"
    class="px-4 py-2 bg-blue-600 rounded"
  >
    <slot> {{ label }} </slot>
  </button>
</template>
