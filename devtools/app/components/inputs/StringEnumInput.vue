<script setup lang="ts">
import type { StringEnumInputSchema } from '#module/runtime/server/services/infer'

const props = defineProps<{ schema: StringEnumInputSchema }>()

const sizes = ['xs', 'sm', 'md', 'lg', 'xl']
function parseSize(size: string) {
  const sizePattern = sizes.join('|')
  const regex = new RegExp(`^(\\d*)(${sizePattern})$`, 'i')

  const match = size.match(regex)

  if (!match) return null

  const number = match[1] ? Number.parseInt(match[1], 10) : 1 // Default to 1 if no number is present
  const suffix = match[2] ?? ''

  return { number, suffix }
}

const options = computed(() => {
  return [...props.schema.schema].sort((a, b) => {
    const sizeA = parseSize(a)
    const sizeB = parseSize(b)
    if (!sizeA || !sizeB) return a.localeCompare(b)

    const suffixAIndex = sizes.indexOf(sizeA.suffix)
    const suffixBIndex = sizes.indexOf(sizeB.suffix)

    if (suffixAIndex !== -1 && suffixBIndex !== -1) {
      if (suffixAIndex !== suffixBIndex) {
        return suffixAIndex - suffixBIndex
      }
    } else if (suffixAIndex === -1 || suffixBIndex === -1) {
      if (sizeA.suffix !== sizeB.suffix) {
        return sizeA.suffix.localeCompare(sizeB.suffix)
      }
    }
    return sizeA.number - sizeB.number
  })
})
</script>

<template>
  <USelectMenu
    :items="options"
    class="min-w-56"
  />
</template>
