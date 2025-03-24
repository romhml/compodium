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

onMounted(() => {
  // Forward keyboard events to the devtools window so shortcuts like Meta+K works in Compodium.
  if (window?.parent) {
    window.addEventListener('keydown', e => window.parent.dispatchEvent(new KeyboardEvent('keydown', e)))
  }
})
</script>

<template>
  <UApp>
    <div class="relative flex justify-center items-center h-screen w-full font-sans">
      <NuxtPage />
    </div>
  </UApp>
</template>
