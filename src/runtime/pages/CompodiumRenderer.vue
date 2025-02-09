<script setup lang="ts">
import { onUnmounted, onMounted, reactive } from 'vue'
import { useColorMode } from '@vueuse/core'
import { defineAsyncComponent, useRoute, computed } from '#imports'

const route = useRoute()

// TODO: Replace me with something generic
const componentPath = '../../../playground/' + route.query.path
const component = computed(() => {
  return defineAsyncComponent(() => import(/* @vite-ignore */ componentPath))
})

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', async () => {
    // TODO: Find a way to fetch updated component meta after HMR.
    const event = new Event('compodium:meta-reload')
    window.parent.dispatchEvent(event)
  })
}

const state = reactive<{ props?: object }>({})

function onUpdateRenderer(event: Event & { data?: any }) {
  state.props = { ...event.data.props }
}

const colorMode = useColorMode()
function onUpdateColorMode(event: Event & { data?: typeof colorMode.value }) {
  if (event.data) colorMode.value = event.data
}

onMounted(() => {
  window.parent.addEventListener('compodium:update-renderer', onUpdateRenderer)
  window.parent.addEventListener('compodium:update-color-mode', onUpdateColorMode)
})

onUnmounted(() => {
  window.parent.removeEventListener('compodium:update-renderer', onUpdateRenderer)
  window.parent.removeEventListener('compodium:update-color-mode', onUpdateColorMode)
})

onMounted(async () => {
  const event: Event = new Event('compodium:component-loaded')
  window.parent.dispatchEvent(event)
})

onMounted(() => {
  if (!route.query?.example) return
})
</script>

<template>
  <div
    id="compodium-renderer"
    class="compodium-component-renderer"
  >
    <component
      :is="component"
      v-if="component"
      v-bind="state.props"
    />
  </div>
</template>

<style>
body {
  margin: 0px;
}

.compodium-component-renderer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='%23fff'/%3E%3Cpath fill='none' stroke='hsla(0, 0%25, 98%25, 1)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
  background-size: 40px 40px;
}

.dark
.compodium-component-renderer {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='hsl(0, 0%25, 8.5%25)'/%3E%3Cpath fill='none' stroke='hsl(0, 0%25, 11.0%25)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
}
</style>
