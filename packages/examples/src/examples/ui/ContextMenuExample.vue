<script setup lang="ts">
import UContextMenu from '@nuxt/ui/runtime/components/ContextMenu.vue'

extendCompodiumMeta({
  defaultProps: {
    items: [
      {
        label: 'System',
        icon: 'i-lucide-monitor'
      },
      {
        label: 'Light',
        icon: 'i-lucide-sun'
      },
      {
        label: 'Dark',
        icon: 'i-lucide-moon'
      }
    ]
  }
})
</script>

<template>
  <UContextMenu>
    <div class="placeholder aspect-video w-72">
      Right click here
    </div>
  </UContextMenu>
</template>
