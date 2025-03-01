<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue'
import { useColorMode } from '@vueuse/core'
// @ts-expect-error virtual file
import { buildAssetsURL } from '#internal/nuxt/paths'
import { useNuxtApp } from '#imports'
// // @ts-expect-error virtual file
// import components from '#build/compodium/components.json'
import type { CompodiumHooks } from '../types'
import type { Hookable } from 'hookable'

// Silence Nuxt warnings on unused pages / layouts
const app = useNuxtApp()
app._isNuxtPageUsed = true
app._isNuxtLayoutUsed = true

const props = shallowRef()
const component = shallowRef()

const componentId = ref()

async function onUpdateComponent(payload: { collectionId: string, componentId: string, baseName: string, path: string, props: Record<string, any> }) {
  component.value = null
  componentId.value = payload.componentId
  props.value = payload.props
  // FIXME: This might not be very secure...
  // It's required because imports to virtual templates don't update properly on HMR.
  component.value = await import(/* @vite-ignore */ buildAssetsURL(payload.path)).then(c => c.default)
}

if (import.meta.hot) {
  import.meta.hot.on('compodium:hmr', data => hooks.value?.callHook(data.event, data))
}

const colorMode = useColorMode()
const hooks = shallowRef<Hookable<CompodiumHooks>>()

onMounted(() => {
  hooks.value = window.parent.__COMPODIUM_HOOKS__ as Hookable<CompodiumHooks>

  hooks.value.hook('renderer:update-component', onUpdateComponent)
  hooks.value.hook('renderer:update-props', payload => props.value = { ...payload.props })
  hooks.value.hook('renderer:set-color', color => colorMode.value = color)

  hooks.value.callHook('renderer:mounted')
})

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    window.parent.dispatchEvent(new KeyboardEvent('keydown', e))
  })
})
</script>

<template>
  <component
    :is="component"
    v-if="component"
    v-bind="props"
  />
</template>
