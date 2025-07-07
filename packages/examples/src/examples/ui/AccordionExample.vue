<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    items: [{
      label: 'Getting Started',
      icon: 'i-lucide-info',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.'
    }, {
      label: 'Installation',
      icon: 'i-lucide-download',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.'
    }, {
      label: 'Theming',
      icon: 'i-lucide-pipette',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.'
    }]
  }
})
</script>

<template>
  <UAccordion class="w-96" />
</template>
