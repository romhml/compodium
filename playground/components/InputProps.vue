<script setup lang="ts">
const _props = defineProps<{
  string?: string
  number?: number
  boolean?: boolean
  primitiveUnion?: string | number | boolean
  stringArray: string[]
  numberArray: number[]
  booleanArray: boolean[]
  object?: { foo: string }
  objectArray?: ({ foo: string | number } | { fee: string })[]
  arrayOfMultipleObjects?: ({ foo: string | number } | { fee: string })[]
  multipleArrayOfMultipleObjects?: ({ foo: string | number } | { fee: string })[] | ({ foo: number } | { fee: string })[]
  objectMatrix?: (({ foo: string | number } | { fee: string })[] | ({ foo: number } | { fee: string })[])[]
  numberMatrix?: number[][]
  literalMatrix?: (number | string | boolean)[][]
  aVeryVeryVeryLongPropNameWithLongType: ({ foo: string | number } | { fee: string })[] | ({ foo: number } | { fee: string })[][]
}>()

extendCompodiumMeta<typeof _props>({
  defaultProps: {
    string: 'hello',
    primitiveUnion: 42,
    objectArray: [{ foo: 'aksjda' }],
    object: { foo: 'kasjdkja' }
  }
})
</script>

<template>
  <p> Supported prop types </p>
</template>
