<script setup lang="ts">
// Disable devtools in component renderer iframe
// @ts-expect-error - Nuxt Devtools internal value
window.__NUXT_DEVTOOLS_DISABLE__ = true

const appConfig = useAppConfig()

useAsyncData('__compodium-fetch-colors', async () => {
  const colors = await $fetch('/api/colors', { baseURL: '/__compodium__' })
  if (colors) appConfig.ui!.colors = { ...appConfig.ui!.colors, ...colors as any }
  return true
})
</script>

<template>
  <UApp class="flex justify-center items-center h-screen w-full relative font-sans">
    <NuxtPage />
  </UApp>
</template>
