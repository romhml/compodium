<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    id: '1',
    role: 'user',
    parts: [{
      type: 'text',
      text: 'Hello! How can I help you today?'
    }],
    avatar: {
      src: 'https://avatars.githubusercontent.com/u/739984?v=4',
      alt: 'Assistant'
    }
  }
})
</script>

<template>
  <UChatMessage />
</template>
