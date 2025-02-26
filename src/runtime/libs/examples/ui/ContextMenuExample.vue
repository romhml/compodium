<script setup lang="ts">
import { ref } from '#imports'

const items = ref([
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
])
</script>

<template>
  <UContextMenu :items="items">
    <Placeholder class="aspect-video w-72">
      Right click here
    </Placeholder>
  </UContextMenu>
</template>
