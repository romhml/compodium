<script setup lang="ts">
import UAvatar from '@nuxt/ui/runtime/components/Avatar.vue'

extendCompodiumMeta({
  defaultProps: {
    src: 'https://avatars.githubusercontent.com/u/739984?v=4',
    alt: 'Benjamin Canac'
  }
})
</script>

<template>
  <UAvatar />
</template>
