<script setup lang="ts">
/// <reference lib="dom" />
/// <reference types="vite/client" />

import { onMounted, shallowRef, ref, computed, toRaw } from 'vue'
import type { CompodiumHooks } from '@compodium/core'
import { onKeyStroke, useColorMode } from '@vueuse/core'
import { joinURL } from 'ufo'
import { createHooks } from 'hookable'
import type { Hookable } from 'hookable'

import RendererGrid from './components/RendererGrid.vue'
import type { ComboOption } from './components/RendererCombo.vue'
import RendererCombo from './components/RendererCombo.vue'
import RendererWrapper from './components/RendererWrapper.vue'

// @ts-expect-error virtual module
import PreviewComponent from 'virtual:compodium:preview'

const isNuxt = !!(window as any)?.__buildAssetsURL

const props = shallowRef()
const component = shallowRef()
const wrapper = shallowRef()

const events = shallowRef<string[]>()
const eventHandlers = computed(() => {
  return {
    ...events.value?.reduce((acc, event) => {
      acc[event] = (data: any) => hooks.value?.callHook('component:event', { name: event, data: toRaw(data) })
      return acc
    }, {} as Record<string, any>)
  }
})

const combo = shallowRef<ComboOption[]>([])

async function importComponent(path: string) {
  if (isNuxt) return await import(/* @vite-ignore */ (window as any)?.__buildAssetsURL(path)).then(c => c.default)
  return await import(/* @vite-ignore */ joinURL(import.meta.env.BASE_URL, '/@fs/', path)).then(c => c.default)
}

async function onUpdateComponent(payload: Parameters<CompodiumHooks['renderer:update-component']>[0]) {
  combo.value = []
  component.value = null
  wrapper.value = null
  props.value = payload.props
  events.value = payload.events

  if (payload.wrapper) {
    wrapper.value = await importComponent(payload.wrapper)
  }
  component.value = await importComponent(payload.path)
}

if (import.meta.hot) {
  import.meta.hot.on('compodium:hmr', data => hooks.value?.callHook(data.event, data.path))
}

const showGrid = ref(false)
const gridGap = ref(8)

const colorMode = useColorMode()
const hooks = shallowRef<Hookable<CompodiumHooks>>()

onMounted(() => {
  hooks.value = window.parent.__COMPODIUM_HOOKS__ as Hookable<CompodiumHooks> ?? createHooks<CompodiumHooks>()
  window.__COMPODIUM_HOOKS__ = hooks.value

  hooks.value.hook('renderer:update-component', onUpdateComponent)
  hooks.value.hook('renderer:update-props', payload => props.value = { ...payload.props })
  hooks.value.hook('renderer:update-combo', payload => combo.value = payload.props)
  hooks.value.hook('renderer:grid', (payload) => {
    showGrid.value = payload.enabled
    gridGap.value = payload.gap
  })

  hooks.value.hook('renderer:set-color', color => colorMode.value = color)
  hooks.value.callHook('renderer:mounted', import.meta.hot)
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
  <Suspense>
    <div
      id="__compodium-root"
      :style="{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: '100vw',
        width: 'fit-content',
        minHeight: '100vh',
        padding: '48px'
      }"
    >
      <PreviewComponent data-testid="__compodium-preview">
        <RendererWrapper :wrapper="wrapper">
          <RendererCombo
            :combo="combo"
            :props
            #="{ props: comboProps }"
          >
            <component
              :is="component"
              v-if="component"
              v-bind="comboProps"
              v-on="eventHandlers"
            />
          </RendererCombo>
        </RendererWrapper>
      </PreviewComponent>

      <RendererGrid
        v-if="showGrid"
        v-model:gap="gridGap"
      />
    </div>
  </Suspense>
</template>
