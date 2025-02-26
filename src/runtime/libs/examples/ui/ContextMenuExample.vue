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
    <div class="flex items-center justify-center rounded-md border border-dashed border-(--ui-border-accented) text-sm aspect-video w-72">
      Right click here
    </div>
  </UContextMenu>
</template>
