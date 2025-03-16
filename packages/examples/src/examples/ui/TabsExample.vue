<script setup lang="ts">
import UTabs from '@nuxt/ui/runtime/components/Tabs.vue'

extendCompodiumMeta({
  defaultProps: {
    items: [{
      label: 'Tab 1',
      avatar: { src: 'https://avatars.githubusercontent.com/u/739984?v=4' },
      content: 'This is the content shown for Tab 1'
    }, {
      label: 'Tab 2',
      icon: 'i-lucide-user',
      content: 'And, this is the content for Tab 2'
    }, {
      label: 'Tab 3',
      icon: 'i-lucide-bell',
      content: 'Finally, this is the content for Tab 3'
    }]
  }
})
</script>

<template>
  <UTabs />
</template>
