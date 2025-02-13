<script setup lang="ts">
withDefaults(defineProps<{
  /**
   This prop has a description with `backticks`
   */
  label: string
  withDefault: string
  variant: 'outline' | 'solid'
  foo: boolean
  obj: { foo: string, bar: number }
  arr: string[]
  arrObj: { baz: string }[]
}>(), { withDefault: 'default' })

defineEmits([])
</script>

<template>
  <button :class="{ border: variant === 'outline' }">
    <slot> {{ label }} </slot>
  </button>
</template>
