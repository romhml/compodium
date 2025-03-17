<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue'
import type { CompodiumHooks } from '@compodium/core'
import { useColorMode } from '@vueuse/core'
import { joinURL } from 'ufo'
import type { Hookable } from 'hookable'

import '@compodium/examples/assets/index.css'

// @ts-expect-error virtual module
import PreviewComponent from 'virtual:compodium:preview'

const props = shallowRef()
const component = shallowRef()

const combo = shallowRef<{ value: string, options: string[] }[]>([])

async function onUpdateComponent(payload: { path: string, props: Record<string, any> }) {
  combo.value = []
  component.value = null
  props.value = payload.props

  if ((window as any)?.__buildAssetsURL) {
    component.value = await import(/* @vite-ignore */ (window as any)?.__buildAssetsURL(payload.path)).then(c => c.default)
  } else {
    component.value = await import(/* @vite-ignore */ joinURL('/@fs/' + payload.path)).then(c => c.default)
  }
}

if (import.meta.hot) {
  import.meta.hot.on('compodium:hmr', data => hooks.value?.callHook(data.event, data.path))
}

const showGrid = ref(false)
const gridGap = ref(8)

const colorMode = useColorMode()
const hooks = shallowRef<Hookable<CompodiumHooks>>()

onMounted(() => {
  hooks.value = window.parent.__COMPODIUM_HOOKS__ as Hookable<CompodiumHooks>

  hooks.value.hook('renderer:update-component', onUpdateComponent)
  hooks.value.hook('renderer:update-props', payload => props.value = { ...payload.props })
  hooks.value.hook('renderer:update-combo', payload => combo.value = payload.props)
  hooks.value.hook('renderer:grid', (payload) => {
    showGrid.value = payload.enabled
    gridGap.value = payload.gap
  })

  hooks.value.hook('renderer:set-color', color => colorMode.value = color)
  hooks.value.callHook('renderer:mounted')
})

onMounted(() => {
  window.addEventListener('keydown', e => window.parent.dispatchEvent(new KeyboardEvent('keydown', e)))
})
</script>

<template>
  <Suspense>
    <div
      id="__compodium-root"
      :style="{ position: 'relative', minWidth: '100vw', minHeight: '100vh' }"
    >
      <PreviewComponent>
        <template v-if="combo?.length">
          <template v-if="component">
            <div
              v-for="combo1 in combo[0]?.options ?? [undefined]"
              :key="combo1"
              :style="{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px' }"
            >
              <div
                v-for="combo2 in combo[1]?.options ?? [undefined]"
                :key="combo2"
                :style="{ display: 'flex', alignContent: 'center', justifyContent: 'center' }"
              >
                <component
                  :is="component"
                  v-bind="{
                    ...props,
                    [combo[0]?.value]: combo1,
                    [combo[1]?.value]: combo2
                  }"
                />
              </div>
            </div>
          </template>
        </template>

        <template v-else>
          <component
            :is="component"
            v-if="component"
            v-bind="props"
          />
        </template>
      </PreviewComponent>

      <div
        v-if="showGrid"
        class="grid-background absolute z-50 inset-0"
        :style="{
          position: 'absolute',
          inset: 0,
          zIndex: 99999,
          backgroundImage: 'linear-gradient(to right, var(--ui-border-accented, #71717b) 1px, transparent 1px), linear-gradient(to bottom, var(--ui-border-accented, #71717b) 1px, transparent 1px)',
          opacity: '50%',
          backgroundPosition: 'center',
          backgroundSize: `${gridGap}px ${gridGap}px`,
          pointerEvents: 'none'
        }"
      />
    </div>
  </Suspense>
</template>
