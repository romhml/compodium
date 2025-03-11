<script setup lang="ts">
const _props = defineProps<{
  // Basic types
  string?: string
  number?: number
  boolean?: boolean
  primitiveUnion?: string | number | boolean

  // Arrays
  stringArray?: string[]
  numberArray?: number[]
  booleanArray?: boolean[]

  /**
   * @IconifyIcon
   */
  icon?: string

  // Objects
  object?: { foo: string }
  objectArray?: ({ foo: string | number } | { fee: string })[]
  arrayOfMultipleObjects?: ({ foo: string | number } | { fee: string })[]

  // Complex types
  multipleArrayOfMultipleObjects?:
    | ({ foo: string | number } | { fee: string })[]
    | ({ foo: number } | { fee: string })[]
  objectMatrix?:
    | (({ foo: string | number } | { fee: string })[]
      | ({ foo: number } | { fee: string })[])[]
  numberMatrix?: number[][]
  literalMatrix?: (number | string | boolean)[][]
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
  <p>Supported prop types</p>
</template>
