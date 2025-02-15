<script setup lang="ts">
import { onUnmounted, onMounted, shallowRef } from 'vue'
import { useColorMode } from '@vueuse/core'
// @ts-expect-error virtual file
import { buildAssetsURL } from '#internal/nuxt/paths'
// @ts-expect-error virtual file
import components from '#build/compodium/components.mjs'

const props = shallowRef({})
const component = shallowRef()
const componentName = shallowRef()
const componentPath = shallowRef()

async function onUpdateComponent(event: Event & { data?: { component: string, props: any } }) {
  const path = components[event.data?.component]?.filePath
  component.value = await import(/* @vite-ignore */ buildAssetsURL(path)).then(c => c.default)
  componentName.value = event.data?.component
  componentPath.value = path
  props.value = { ...event.data?.props }
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent.dispatchEvent(new Event ('compodium:meta-reload'))
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
    v-if="component"
    v-bind="props"
  />
</template>
