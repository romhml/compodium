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
}>()
</script>

<template>
  <div>
    {{ label ?? 'Hello world' }}
  </div>
</template>
