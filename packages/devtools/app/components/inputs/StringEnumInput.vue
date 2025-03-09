<script setup lang="ts">
import type { StringEnumInputSchema } from '@compodium/core'
import { getEnumOptions } from '../../utils/enum'

const props = defineProps<{ schema: StringEnumInputSchema }>()
const options = computed(() => getEnumOptions(props.schema))
</script>

<template>
  <USelectMenu :items="options" />
</template>
