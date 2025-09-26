<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    error: {
      statusCode: 404,
      statusMessage: 'Page not found',
      message: 'The page you are looking for does not exist.'
    }
  }
})
</script>

<template>
  <UError />
</template>
