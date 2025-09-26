<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    commands: [
      { id: 'search', label: 'Search', icon: 'i-heroicons-magnifying-glass' },
      { id: 'help', label: 'Help', icon: 'i-heroicons-question-mark-circle' },
      { id: 'settings', label: 'Settings', icon: 'i-heroicons-cog-6-tooth' },
      { id: 'clear', label: 'Clear Chat', icon: 'i-heroicons-trash' }
    ]
  }
})
</script>

<template>
  <UChatPalette>
    <UChatMessages
      :messages="[
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
      ]"
    />

    <template #prompt>
      <UChatPrompt />
    </template>
  </UChatPalette>
</template>
