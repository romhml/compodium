<template>
  <button> {{ label }} </button>
</template>

<script setup lang="ts">
const _props = defineProps<{ label: string }>()

extendCompodiumMeta<typeof _props>({
  defaultProps: { label: 'Click me!' }
})
</script>
