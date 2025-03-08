<script setup lang="ts">
import type { PrimitiveArrayInputSchema } from 'compodium/types'

const props = defineProps<{ schema: PrimitiveArrayInputSchema }>()

const searchTerm = ref('')
const items = ref<string[]>([])
const modelValue = defineModel<any[]>()

const inputValue = computed({
  get() {
    return modelValue.value?.map(v => v.toString())
  },
  set(value: string[]) {
    modelValue.value = (props.schema as any).schema[0] === 'number' ? value.map(Number) : value
  }
})

function onCreate(item: string) {
  items.value.push(item)
  inputValue.value = [...inputValue.value ?? [], item]
  searchTerm.value = ''
}
</script>

<template>
  <StringEnumInput
    v-if="typeof (schema.schema as any)?.[0] === 'object' && (schema?.schema as any)?.[0]?.kind === 'enum'"
    v-model="modelValue"
    multiple
    :schema="(props.schema as any)?.schema[0]"
  />
  <UInputMenu
    v-else
    v-model="inputValue"
    v-model:search-term="searchTerm"
    multiple
    create-item
    no-portal
    :items="items"
    :ui="{ viewport: 'invisible', content: 'invisible' }"
    @create="onCreate"
  >
    <template #trailing>
      <span />
    </template>
  </UInputMenu>
</template>
