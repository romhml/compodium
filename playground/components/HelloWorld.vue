<script setup lang="ts">
type TotoName = {
  tutu: string
}

type OtherType = {
  tata: string
}

type AcceptableValue = string | number | boolean

defineProps<{
  label?: string | number
  other?: TotoName | OtherType | { inline: string }
  array?: Array<string | number>
  arraymult?: AcceptableValue[]
  arraymultEnu?: ('toto' | 'titi' | 'tutut')[]
  date?: Date
  bool?: boolean
  /* This field is heavily nested. */
  nested?: {
    /* This nested attribute also has a description. */
    label?: string | number
    other?: TotoName | OtherType | { inline: string }
    array?: Array<string | number>
    arraymult?: AcceptableValue[]
    arraymultEnu?: ('toto' | 'titi' | 'tutut')[]
    date?: Date
    bool?: boolean
  }
  nestedArray?: Array<{
    /* This nested attribute also has a description. */
    label?: string | number
    other?: TotoName | OtherType | { inline: string }
    array?: Array<string | number>
    arraymult?: AcceptableValue[]
    arraymultEnu?: ('toto' | 'titi' | 'tutut')[]
    date?: Date
    bool?: boolean
  }>
}>()
</script>

<template>
  <div>
    {{ label ?? 'Hello world' }}
  </div>
</template>
