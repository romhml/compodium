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

const messages = [
  {
    id: '1',
    content: 'Hello! How can I help you today?',
    role: 'assistant'
  },
  {
    id: '2',
    content: 'I need help with my project setup.',
    role: 'user'
  },
  {
    id: '3',
    content: 'I\'d be happy to help! What kind of project are you working on?',
    role: 'assistant'
  }
]
</script>

<template>
  <UChatPalette>
    <UChatMessages :messages />
    <template #prompt>
      <UChatPrompt />
    </template>
  </UChatPalette>
</template>
