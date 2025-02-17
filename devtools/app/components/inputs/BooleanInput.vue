<script lang="ts">
import { z } from 'zod'

export const booleanInputSchema = z.literal('boolean').or(z.object({
  kind: z.literal('enum'),
  type: z.string().refine((type) => {
    return type.split(' | ').filter(t => !['undefined', 'null'].includes(t)).every(t => ['boolean', 'true', 'false'].includes(t))
  })
}))

export type BooleanInputSchema = z.infer<typeof booleanInputSchema>
</script>

<script setup lang="ts">
defineProps<{ schema: BooleanInputSchema }>()
</script>

<template>
  <USwitch />
</template>
