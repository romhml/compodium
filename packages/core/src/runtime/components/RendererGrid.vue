<template>
  <div
    class="grid-background absolute z-50 inset-0"
    :style="{
      position: 'absolute',
      inset: 0,
      zIndex: 99999,
      backgroundImage: 'linear-gradient(to right, var(--ui-border-accented, #71717b) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-border-accented, #71717b) 1px, transparent 1px)',
      opacity: '50%',
      backgroundPosition: 'center',
      backgroundSize: `${gap}px ${gap}px`,
      pointerEvents: 'none'
    }"
  />
</template>

<script setup lang="ts">
const gap = defineModel<number>('gap')
</script>
