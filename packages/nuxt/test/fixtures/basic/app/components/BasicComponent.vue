<script setup lang="ts">
import type { BasicComponentProps } from '#fixture-types'

defineProps<BasicComponentProps>()
extendCompodiumMeta({ defaultProps: { fromComponent: true }, combo: ['foo'] })
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
