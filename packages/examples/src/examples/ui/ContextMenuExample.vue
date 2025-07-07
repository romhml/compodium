<script setup lang="ts">
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
  <div>
    <UContextMenu>
      <div class="placeholder aspect-video w-72">
        Right click here
      </div>
    </UContextMenu>
  </div>
</template>
