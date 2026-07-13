<script setup lang="ts">
import type { BasicComponentProps } from '#fixture-types'

defineProps<BasicComponentProps>()
</script>

<template>
  <span data-testid="basic"> {{ foo }} </span>
</template>
