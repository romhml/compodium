<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    messages: [
      {
        id: '1',
        content: 'Hello! How can I help you today?',
        role: 'assistant',
        timestamp: new Date(Date.now() - 5000).toISOString()
      },
      {
        id: '2',
        content: 'I need help with my project setup.',
        role: 'user',
        timestamp: new Date(Date.now() - 3000).toISOString()
      },
      {
        id: '3',
        content: 'I\'d be happy to help! What kind of project are you working on?',
        role: 'assistant',
        timestamp: new Date().toISOString()
      }
    ]
  }
})
</script>

<template>
  <UChatMessages class="max-h-96 overflow-y-auto" />
</template>
