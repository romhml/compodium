<script setup lang="ts">
import UBreadcrumb from '@nuxt/ui/runtime/components/Breadcrumb.vue'

extendCompodiumMeta({
  defaultProps: {
    // Props
    items: [
      { label: 'Home', to: '/' },
      {
        slot: 'dropdown',
        icon: 'i-lucide-ellipsis',
        children: [{
          label: 'Documentation'
        }, {
          label: 'Themes'
        }, {
          label: 'GitHub'
        }]
      }, {
        label: 'Components',
        disabled: true
      }, {
        label: 'Breadcrumb',
        to: '/components/breadcrumb'
      }
    ]
  }
})
</script>

<template>
  <UBreadcrumb />
</template>
