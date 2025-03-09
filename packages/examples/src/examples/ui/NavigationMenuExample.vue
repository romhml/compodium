<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    items: [
      [{
        label: 'Documentation',
        icon: 'i-lucide-book-open',
        badge: 10,
        children: [{
          label: 'Introduction',
          description: 'Fully styled and customizable components for Nuxt.',
          icon: 'i-lucide-house'
        }, {
          label: 'Installation',
          description: 'Learn how to install and configure Nuxt UI in your application.',
          icon: 'i-lucide-cloud-download'
        }, {
          label: 'Theming',
          description: 'Learn how to customize the look and feel of the components.',
          icon: 'i-lucide-swatch-book'
        }, {
          label: 'Shortcuts',
          description: 'Learn how to display and define keyboard shortcuts in your app.',
          icon: 'i-lucide-monitor'
        }]
      }, {
        label: 'GitHub',
        icon: 'i-simple-icons-github',
        to: 'https://github.com/nuxt/ui',
        target: '_blank'
      }, {
        label: 'Help',
        icon: 'i-lucide-circle-help',
        disabled: true
      }]
    ]
  }
})
</script>

<template>
  <UNavigationMenu />
</template>
