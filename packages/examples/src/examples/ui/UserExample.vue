<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    name: 'John Doe',
    description: 'Software Engineer',
    avatar: {
      src: 'https://i.pravatar.cc/150?u=john-doe'
    }
  }
})
</script>

<template>
  <UUser />
</template>
