<script setup lang="ts">
import UApp from '@nuxt/ui/runtime/components/App.vue'
import UTooltip from '@nuxt/ui/runtime/components/Tooltip.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'

extendCompodiumMeta({
  defaultProps: {
    text: 'Tooltip'
  }
})
</script>

<template>
  <UApp>
    <UTooltip v-bind="$attrs">
      <UButton
        label="Show Tooltip"
        color="neutral"
        variant="subtle"
      />
    </UTooltip>
  </UApp>
</template>
