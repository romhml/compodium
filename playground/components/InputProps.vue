<script setup lang="ts">
const _props = defineProps<{
  string?: string
  number?: number
  boolean?: boolean
  primitiveUnion?: string | number | boolean
  stringArray: string[]
  /**
   * This is a very long description of things I don't know yet what I'm going to say but it just needs to be long, not to make sense.
   */
  numberArray: number[]
  /**
   * This is a very long description of things I don't know yet what I'm going to say but it just needs to be long, not to make sense.
   */
  booleanArray: boolean[]
  /**
   * This is a very long description of things I don't know yet what I'm going to say but it just needs to be long, not to make sense.
   */
  object?: { foo: string }
  /**
   * This is a very long description of things I don't know yet what I'm going to say but it just needs to be long, not to make sense.
   */
  objectArray?: ({ foo: string | number } | { fee: string })[]
  /**
   * This is a very long description of things I don't know yet what I'm going to say but it just needs to be long, not to make sense.
   */
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
    objectArray: [{ foo: 'bar' }],
    object: { foo: 'bar' },
    arrayOfMultipleObjects: [{ foo: 'bar' }, { fee: 'bar' }],
    multipleArrayOfMultipleObjects: [{ foo: 'bar' }, { fee: 'bar' }],
    objectMatrix: [[{ foo: 'bar' }, { fee: 'bar' }], [{ foo: 42 }]],
    numberMatrix: [[42, 42], [42]],
    literalMatrix: [['string', true], [42]]
  }
})
</script>

<template>
  <p> Supported prop types </p>
</template>
