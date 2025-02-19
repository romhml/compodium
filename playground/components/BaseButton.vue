<template>
  <button
    class="px-3 py-2 rounded-md"
    :class="{
      'border border-yellow-500 text-yellow-500': variant === 'outline',
      'bg-yellow-500 text-neutral-900': variant === 'solid',
      'opacity-80 cursor-not-allowed': disabled
    }"
  >
    Click me!
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'outline' | 'solid'
  disabled?: boolean
  size: 'sm' | 'md' | 'lg'
  nestedProp: { label: string }[]
  simpleList: string[]
}>(), { variant: 'outline' })
</script>
