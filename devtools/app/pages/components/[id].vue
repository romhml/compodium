<script setup lang="ts">
import { useColorMode, useDebounceFn } from '@vueuse/core'
import type { ComponentMeta } from '#module/types'
import type { PropertyMeta } from 'vue-component-meta'

// Disable devtools in component renderer iframe
// @ts-expect-error - Nuxt Devtools internal value
window.__NUXT_DEVTOOLS_DISABLE__ = true

function parseComponentMeta(component: ComponentMeta): ComponentMeta {
  return {
    ...component,
    meta: {
      ...component.meta,
      props: component.meta?.props.map((prop: any) => ({
        ...prop,
        default: getDefaultPropValue(prop)
      }))
    }
  }
}

function getDefaultPropValue(meta: Partial<PropertyMeta>) {
  if (!meta.default) return
  try {
    return new Function(`return ${meta.default}`)()
  } catch {
    console.warn(`[Compodium] Could not evaluate default value for property ${meta.name}`)
  }
}

const route = useRoute()

const componentId = computed(() => route.params.id as string)
const exampleId = computed(() => route.query.example as string)
const props = useState<Record<string, any>>('__component_state', () => ({}))

const { fetchCollections, getComponent, getExampleComponent } = useCollections()

const component = computed(() => exampleId.value ? getExampleComponent(exampleId.value) : getComponent(componentId.value))

const { data: componentMeta, refresh: refreshComponent } = useAsyncData('__compodium-fetch-meta', async () => {
  const meta = await $fetch<ComponentMeta>(`/api/component-meta/${componentId.value}`, { baseURL: '/__compodium__' })
  // Don't update props or renderer if the component has not changed (e.g. after HMR)
  if (!componentMeta.value || componentMeta.value?.pascalName !== componentId.value) {
    props.value = { ...meta.defaultProps }
    updateRendererComponent()
  }
  return parseComponentMeta(meta)
}, { watch: [componentId] })

function updateRendererComponent() {
  const event: Event & { data?: { component?: string, props?: any, path?: string } } = new Event('compodium:update-component')
  event.data = { component: component.value?.pascalName, props: props.value, path: component.value?.filePath }
  window.dispatchEvent(event)
}

watch([exampleId], () => {
  updateRendererComponent()
})

function updateRenderer() {
  const event: Event & { data?: any } = new Event('compodium:update-props')
  event.data = { props: props.value }
  window.dispatchEvent(event)
}

const updateRendererDebounced = useDebounceFn(updateRenderer, 100, { maxWait: 300 })

function onComponentLoaded() {
  updateRenderer()
}

const fetchCollectionsDebounced = useDebounceFn(fetchCollections, 300)
const refreshComponentDebounced = useDebounceFn(() => refreshComponent(), 300)

onMounted(() => {
  window.addEventListener('compodium:renderer-mounted', updateRendererComponent)
  window.addEventListener('compodium:component-loaded', onComponentLoaded)
  window.addEventListener('compodium:component-added', fetchCollectionsDebounced)
  window.addEventListener('compodium:component-changed', refreshComponentDebounced)
  window.addEventListener('compodium:component-removed', fetchCollectionsDebounced)
})

onUnmounted(() => {
  window.removeEventListener('compodium:renderer-mounted', updateRendererComponent)
  window.removeEventListener('compodium:component-loaded', onComponentLoaded)
  window.removeEventListener('compodium:component-added', fetchCollectionsDebounced)
  window.removeEventListener('compodium:component-changed', refreshComponentDebounced)
  window.removeEventListener('compodium:component-removed', fetchCollectionsDebounced)
})

const tabs = computed(() => {
  return [
    { label: 'Props', slot: 'props', icon: 'lucide:settings' },
    { label: 'Code', slot: 'code', icon: 'lucide:code' }
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
    window.dispatchEvent(event)
  }
})

const isRotated = ref(false)

function onResetState() {
  if (isRotated.value) return
  setTimeout(() => isRotated.value = false, 500)
  isRotated.value = true
  props.value = { ...componentMeta.value?.defaultProps }
  updateRendererDebounced()
}
</script>

<template>
  <div class="xl:col-span-5 col-span-2 relative">
    <ComponentPreview class="grow h-full" />
    <div class="flex gap-2 absolute top-1 right-2">
      <UButton
        v-if="componentMeta?.docUrl"
        icon="lucide:book-open"
        variant="link"
        class="rounded-full"
        color="neutral"
        :href="componentMeta?.docUrl"
        target="_blank"
      />
      <UButton
        icon="lucide:rotate-cw"
        variant="link"
        color="neutral"
        class="rounded-full"
        :class="{ 'animate-rotate': isRotated }"
        @click="onResetState"
      />
      <UButton
        :icon="isDark ? 'lucide:moon' : 'lucide:sun'"
        variant="link"
        class="rounded-full"
        color="neutral"
        @click="isDark = !isDark"
      />
    </div>
  </div>

  <div class="bg-(--ui-bg) flex flex-col col-span-2 overflow-y-auto border-l border-(--ui-border)">
    <UTabs
      variant="link"
      :items="tabs"
      class="relative h-screen"
      :ui="{ list: 'sticky top-0 bg-(--ui-bg) border-b border-(--ui-border) z-50', content: 'h-full' }"
    >
      <template #props>
        <div
          v-for="prop in componentMeta?.meta.props"
          :key="'prop-' + prop.name"
          class="px-3 py-2 border-b border-(--ui-border)"
        >
          <ComponentPropInput
            v-model="props[prop.name]"
            :schema="prop.schema"
            :name="prop.name"
            :description="prop.description"
            :default="prop.default"
            class="bg-(--ui-bg) p-4"
            @update:model-value="updateRendererDebounced"
          />
        </div>
      </template>

      <template #code>
        <ComponentCode
          class="h-full -mt-2"
          :component="componentMeta"
          :example="exampleId"
          :props="props"
        />
      </template>
    </UTabs>
  </div>
</template>
