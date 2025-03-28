<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

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
  if (window.parent) {
    onKeyStroke(true, (e) => {
      window.parent.dispatchEvent(new KeyboardEvent('keydown', e))
    }, { eventName: 'keydown' })
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
