<script setup lang="ts">
import { useStorage, StorageSerializers, useColorMode, useDebounceFn } from '@vueuse/core'
import type { Component } from '../../src/types'

// Disable devtools in component renderer iframe
// @ts-expect-error - Nuxt Devtools internal value
window.__NUXT_DEVTOOLS_DISABLE__ = true

const currentComponent = useStorage<string>('__compodium-component', 'base-button')
const state = useStorage<Record<string, any>>('__compodium-state', {})
const components = useStorage<Array<Component>>('__compodium-components', [], undefined, { serializer: StorageSerializers.object })

const component = computed<Component | undefined>(() =>
  components.value?.find(c => c.kebabName === currentComponent.value)
  ?? components.value?.find(c => c.kebabName === 'base-button'),
)

function updateMeta(meta: Record<string, Component>) {
  components.value = Object.values(meta)
}

const { status } = useAsyncData('__compodium-components', async () => {
  const resp = await fetch('/api/component-meta')
  const meta = await resp.json()
  updateMeta(meta)
  return true
})

const componentProps = computed(() => {
  if (!component.value) return
  return state.value.props[component.value?.kebabName]
})

const componentPropsMeta = computed(() => {
  const props = component.value?.meta?.props
  return props ? [...props].sort((a, b) => a.name.localeCompare(b.name)) : null
})

function updateRenderer() {
  if (!component.value) return
  const event: Event & { data?: any } = new Event('compodium:update-renderer')
  event.data = {
    props: state.value.props?.[component.value.kebabName],
  }
  window.dispatchEvent(event)
}

const updateRendererDebounced = useDebounceFn(updateRenderer, 100, { maxWait: 300 })

function onComponentLoaded() {
  if (!component.value) return
  updateRenderer()
}

async function onMetaReload(event: any) {
  console.log('received: compodium:meta-reload', event.data)
  const resp = await fetch('/api/component-meta/BaseButton')
  const meta = await resp.json()
  console.log('meta', meta.meta.props)

  updateMeta({ BaseButton: meta })
}

onMounted(() => {
  window.addEventListener('compodium:component-loaded', onComponentLoaded)
  window.addEventListener('compodium:meta-reload', onMetaReload)
})

onUnmounted(() => {
  window.removeEventListener('compodium:component-loaded', onComponentLoaded)
  window.removeEventListener('compodium:meta-reload', onMetaReload)
})

const tabs = computed(() => {
  if (!component.value) return
  return [
    { label: 'Props', slot: 'props', icon: 'i-lucide-settings', disabled: !component.value.meta?.props?.length },
  ]
})

const colorMode = useColorMode()
const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(value) {
    colorMode.value = value ? 'dark' : 'light'

    const event: Event & { data?: string } = new Event('compodium:update-color-mode')
    event.data = colorMode.value
    console.log(event)
    window.dispatchEvent(event)
  },
})
</script>

<template>
  <UApp class="flex justify-center items-center h-screen w-full relative font-sans">
    <div
      v-if="status === 'success'"
      class="top-0 h-[49px] border-b border-[var(--ui-border)] flex justify-center"
    >
      <UInputMenu
        v-model="currentComponent"
        variant="none"
        :items="components"
        value-key="kebabName"
        label-key="pascalName"
        placeholder="Search component..."
        class="top-0 translate-y-0 w-full mx-2"
        icon="i-lucide-search"
      />

      <div class="absolute top-[49px] bottom-0 inset-x-0 grid xl:grid-cols-8 grid-cols-4 bg-[var(--ui-bg)]">
        <div class="col-span-1 border-r border-[var(--ui-border)] hidden xl:block overflow-y-auto">
          <UNavigationMenu
            :items="components.map((c) => ({ ...c, active: c.kebabName === component?.kebabName, onSelect: () => component = c }))"
            orientation="vertical"
            label-key="pascalName"
            :ui="{ link: 'before:rounded-none' }"
          />
        </div>

        <div class="xl:col-span-5 col-span-2 relative">
          <ComponentPreview
            :component="component"
            :props="componentProps"
            class="h-full"
          />
          <div class="flex gap-2 absolute top-1 right-2">
            <UButton
              :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
              variant="ghost"
              color="neutral"
              @click="isDark = !isDark"
            />
          </div>
        </div>

        <div class="border-l border-[var(--ui-border)] flex flex-col col-span-2 overflow-y-auto">
          <UTabs
            color="neutral"
            variant="link"
            :items="tabs"
            class="relative"
            :ui="{ list: 'sticky top-0 bg-[var(--ui-bg)] z-50' }"
          >
            <template #props>
              <div
                v-for="prop in componentPropsMeta"
                :key="'prop-' + prop.name"
                class="px-3 py-5 border-b border-[var(--ui-border)]"
              >
                <ComponentPropInput
                  v-model="componentProps[prop.name]"
                  :meta="prop"
                  @update:model-value="updateRendererDebounced"
                />
              </div>
            </template>
          </UTabs>
        </div>
      </div>
    </div>
  </UApp>
</template>

<style>
@import 'tailwindcss';
@import '@nuxt/ui';

@theme {
  --font-sans: 'DM Sans', sans-serif;

  --color-green-50: #EFFDF5;
  --color-green-100: #D9FBE8;
  --color-green-200: #B3F5D1;
  --color-green-300: #75EDAE;
  --color-green-400: #00DC82;
  --color-green-500: #00C16A;
  --color-green-600: #00A155;
  --color-green-700: #007F45;
  --color-green-800: #016538;
  --color-green-900: #0A5331;
  --color-green-950: #052E16;
}

.shiki
.shiki span {
  background-color: transparent !important;
}

html.dark .shiki,
html.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: transparent !important;
  /* Optional, if you also want font styles */
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
</style>
