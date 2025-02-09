<script setup lang="ts">
const route = useRoute()
if (!route.path.startsWith('/__compodium__')) {
  await navigateTo('/__compodium__/devtools')
}
</script>

<template>
  <NuxtPage />
</template>
