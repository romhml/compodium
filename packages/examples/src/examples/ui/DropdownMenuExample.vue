<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    items: [
      [
        {
          label: 'Benjamin',
          avatar: {
            src: 'https://github.com/benjamincanac.png',
            loading: 'lazy'
          },
          type: 'label'
        }
      ],
      [
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
          icon: 'i-lucide-cog',
          kbds: [',']
        },
        {
          label: 'Keyboard shortcuts',
          icon: 'i-lucide-monitor'
        }
      ]
    ]
  }
})
</script>

<template>
  <UDropdownMenu>
    <UButton
      label="Open Menu"
      color="neutral"
      variant="outline"
    />
  </UDropdownMenu>
</template>
