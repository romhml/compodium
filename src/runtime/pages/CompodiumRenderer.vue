<script setup lang="ts">
import { onUnmounted, onMounted } from 'vue'
import { useColorMode } from '@vueuse/core'
import { useRoute } from '#imports'
// @ts-expect-error virtual file
import { buildAssetsURL } from '#internal/nuxt/paths'
// @ts-expect-error virtual file
import components from '#build/compodium/components.mjs'

const route = useRoute()

const component = shallowRef(null)
const props = shallowRef({})
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
      v-bind="props"
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
  padding: 20px;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='%23fff'/%3E%3Cpath fill='none' stroke='hsla(0, 0%25, 98%25, 1)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
  background-size: 40px 40px;
}

.dark
.compodium-component-renderer {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='hsl(0, 0%25, 8.5%25)'/%3E%3Cpath fill='none' stroke='hsl(0, 0%25, 11.0%25)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
}
</style>
