<template>
  <template v-if="combinations?.length">
    <div
      v-for="(combination, combinationIndex) in combinations"
      :key="combinationIndex"
      :style="{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px' }"
    >
      <div
        v-for="(comboProps, propsIndex) in combination.combinations"
        :key="propsIndex"
        :style="{ display: 'flex', alignContent: 'center', justifyContent: 'center' }"
      >
        <slot :props="comboProps" />
      </div>
    </div>
  </template>
  <slot
    v-else
    :props="props"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Define the expected structure of the combo prop
export interface ComboOption {
  value: string
  options: string[]
}

const _props = defineProps<{
  combo?: [ComboOption | undefined, ComboOption | undefined]
  props: any
}>()

defineSlots<{
  default(props: { props: any }): any
}>()

const combinations = computed(() => {
  if (!_props.combo?.length) return
  return (_props.combo?.[0]?.options ?? [undefined]).map((option1) => {
    return {
      combinations: (_props.combo?.[1]?.options ?? [undefined]).map(option2 => ({
        ..._props.props,
        [_props.combo?.[0]?.value as any]: option1,
        [_props.combo?.[1]?.value as any]: option2
      }))
    }
  })
})
</script>
