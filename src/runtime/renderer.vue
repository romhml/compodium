<script setup lang="ts">
import { onUnmounted, onMounted, shallowRef, ref } from 'vue'
import { useColorMode } from '@vueuse/core'
// @ts-expect-error virtual file
import { buildAssetsURL } from '#internal/nuxt/paths'
import { useNuxtApp } from '#imports'
// // @ts-expect-error virtual file
// import components from '#build/compodium/components.json'

// Silence Nuxt warnings on unused pages / layouts
const app = useNuxtApp()
app._isNuxtPageUsed = true
app._isNuxtLayoutUsed = true

const props = ref()
const component = shallowRef()

const isUpdating = ref(false)
async function onUpdateComponent(event: Event & { data?: { component: string, props: any, path: string } }) {
  // FIXME: This might not be very secure...
  // It's required because imports to virtual templates don't update properly on HMR.
  isUpdating.value = true
  props.value = { ...event.data?.props }
  component.value = await import(/* @vite-ignore */ buildAssetsURL(event.data?.path)).then(c => c.default)
  isUpdating.value = false
}

if (import.meta.hot) {
  import.meta.hot.on('compodium:hmr', (data) => {
    window.parent.dispatchEvent(new Event(data.event, data))
  })
}

function onUpdateRenderer(event: Event & { data?: any }) {
  props.value = { ...event.data.props }
}

const colorMode = useColorMode()
function onUpdateColorMode(event: Event & { data?: typeof colorMode.value }) {
  if (event.data) colorMode.value = event.data
}

onMounted(() => {
  window.parent.addEventListener('compodium:update-component', onUpdateComponent)
  window.parent.addEventListener('compodium:update-props', onUpdateRenderer)
  window.parent.addEventListener('compodium:update-color-mode', onUpdateColorMode)

  // Signal devtools that the renderer has mounted
  const event: Event = new Event('compodium:renderer-mounted')
  window.parent.dispatchEvent(event)
})

onUnmounted(() => {
  window.parent.removeEventListener('compodium:update-component', onUpdateComponent)
  window.parent.removeEventListener('compodium:update-props', onUpdateRenderer)
  window.parent.removeEventListener('compodium:update-color-mode', onUpdateColorMode)
})
</script>

<template>
  <component
    :is="component"
    v-show="!isUpdating"
    v-if="component"
    v-bind="props"
  />
</template>
