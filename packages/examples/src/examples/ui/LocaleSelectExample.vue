<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    locales: [
      { name: 'English', code: 'en', dir: 'ltr' },
      { name: 'Español', code: 'es', dir: 'ltr' },
      { name: 'Français', code: 'fr', dir: 'ltr' },
      { name: 'Deutsch', code: 'de', dir: 'ltr' }
    ]
  }
})
</script>

<template>
  <ULocaleSelect class="w-40" />
</template>
