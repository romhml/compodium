<script setup lang="ts">
import { onUnmounted, onMounted, shallowRef, ref } from 'vue'
import { useColorMode } from '@vueuse/core'
import { camelCase } from 'scule'
// @ts-expect-error virtual file
import { buildAssetsURL } from '#internal/nuxt/paths'
import { useNuxtApp, useAppConfig } from '#imports'
import { _useCompodiumMetaState } from './composables/extendCompodiumMeta'
// // @ts-expect-error virtual file
// import components from '#build/compodium/components.json'

// Silence Nuxt warnings on unused pages / layouts
const app = useNuxtApp()
app._isNuxtPageUsed = true
app._isNuxtLayoutUsed = true

const appConfig = useAppConfig()
const meta = _useCompodiumMetaState()

const props = shallowRef()
const component = shallowRef()

const isUpdating = ref(false)

async function onUpdateComponent(event: Event & { data?: { collectionId: string, componentId: string, path: string } }) {
  // Reset default props state when changing components. These will be reset by the extendCompodiumMeta call in the setup function if specified.
  isUpdating.value = true
  meta.defaultProps.value = {}

  // FIXME: This might not be very secure...
  // It's required because imports to virtual templates don't update properly on HMR.
  component.value = await import(/* @vite-ignore */ buildAssetsURL(event.data!.path)).then(c => c.default)

  // Wait for next tick for the extendCompodiumMeta to execute
  await nextTick()

  // Fetch default props from appConfig and extendCompodiumMeta
  const appConfigDefaultProps = (appConfig.compodium as any).defaultProps?.[event.data!.collectionId]?.[camelCase(event.data!.componentId)]
  const defaultProps = { ...appConfigDefaultProps, ...meta.defaultProps.value }

  console.log('defaults', defaultProps)
  props.value = defaultProps

  isUpdating.value = false

  // Send default props to the devtools to update component inputs
  const defaultPropsEvent: any = new Event('compodium:component-default-props')
  defaultPropsEvent.data = { defaultProps, componentId: event.data!.componentId }
  console.log(defaultPropsEvent.data)
  window.parent.dispatchEvent(defaultPropsEvent)
}

if (import.meta.hot) {
  import.meta.hot.on('compodium:hmr', data => window.parent.dispatchEvent(new Event(data.event, data)))
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
