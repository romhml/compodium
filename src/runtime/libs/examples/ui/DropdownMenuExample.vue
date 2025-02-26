<script setup lang="ts">
const items = ref([
  {
    label: 'Profile',
    icon: 'i-lucide-user'
  },
  {
    label: 'Billing',
    icon: 'i-lucide-credit-card'
  },
  {
    label: 'Settings',
    icon: 'i-lucide-cog'
  }
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      label="Open"
      icon="i-lucide-menu"
      color="neutral"
      variant="outline"
      trailing-icon
    />
  </UDropdownMenu>
</template>
