<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    defaultValue: 2,
    items: [
      {
        date: 'Mar 15, 2025',
        title: 'Project Kickoff',
        description: 'Kicked off the project with team alignment. Set up project milestones and allocated resources.',
        icon: 'i-lucide-rocket'
      },
      {
        date: 'Mar 29 2025',
        title: 'Development Sprint',
        description: 'Frontend and backend development. Implemented core features and integrated with APIs.',
        icon: 'i-lucide-code'
      },
      {
        date: 'Apr 5 2025',
        title: 'Testing & Deployment',
        description: 'QA testing and performance optimization. Deployed the application to production.',
        icon: 'i-lucide-check-circle'
      }
    ]
  }
})
</script>

<template>
  <UTimeline class="w-96" />
</template>
