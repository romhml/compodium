<script setup lang="ts">
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
