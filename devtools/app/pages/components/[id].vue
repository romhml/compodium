<script setup lang="ts">
import { useColorMode, useDebounceFn } from '@vueuse/core'
import type { ComponentMeta, CompodiumHooks } from '#module/types'
import type { PropertyMeta } from 'vue-component-meta'
import { camelCase } from 'scule'
import { createHooks } from 'hookable'

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

const componentId = computed(() => camelCase(route.params.id as string))
const exampleId = computed(() => route.query.example as string)
const props = useState<Record<string, any>>('__component_state', () => ({}))
const defaultProps = shallowRef({})

const { fetchCollections, getComponent } = useCollections()

const component = computed(() => {
  const baseComponent = getComponent(componentId.value)
  return baseComponent.examples?.find((e: any) => e.pascalName === exampleId.value) ?? baseComponent
})

const { data: componentMeta, refresh: refreshComponent } = useAsyncData('__compodium-fetch-meta', async () => {
  const meta = await $fetch<ComponentMeta>(`/api/component-meta/${componentId.value}`, { baseURL: '/__compodium__' })
  // Don't update props or renderer if the component has not changed (e.g. after HMR)
  if (!componentMeta.value || componentMeta.value?.componentId !== componentId.value) {
    defaultProps.value = {}
    props.value = {}
    await hooks.callHook('renderer:update-component', { collectionId: component.value.collectionId, componentId: component.value.componentId, path: component.value.filePath })
  }
  return parseComponentMeta(meta)
}, { watch: [componentId] })

async function updateRendererComponent() {
  if (!component.value) return
}

watch([exampleId], async () => {
  await hooks.callHook('renderer:update-component', { collectionId: component.value.collectionId, componentId: component.value.componentId, path: component.value.filePath })
})

async function updateRenderer() {
  await hooks.callHook('renderer:update-props', { props: props.value })
}

const updateRendererDebounced = useDebounceFn(updateRenderer, 100, { maxWait: 300 })

function onComponentLoaded() {
  updateRenderer()
}

const fetchCollectionsDebounced = useDebounceFn(fetchCollections, 300)
const refreshComponentDebounced = useDebounceFn(() => refreshComponent(), 300)

async function updateProps(payload: { componentId: string, props: any }) {
  if (componentId.value !== payload.componentId) return
  props.value = { ...props.value, ...payload.props }
  defaultProps.value = payload.props
  await hooks.callHook('renderer:update-props', { props: props.value })
}

const hooks = createHooks<CompodiumHooks>()

hooks.hook('renderer:mounted', updateRendererComponent)
hooks.hook('renderer:component-loaded', onComponentLoaded)
hooks.hook('component:added', fetchCollectionsDebounced)
hooks.hook('component:removed', fetchCollectionsDebounced)
hooks.hook('component:updated', refreshComponentDebounced)
hooks.hook('devtools:update-props', updateProps)

onMounted(() => window.__COMPODIUM_HOOKS__ = hooks)

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
  async set(value) {
    colorMode.value = value ? 'dark' : 'light'
    await hooks.callHook('renderer:set-color', colorMode.value)
  }
})

const isRotated = ref(false)

function onResetState() {
  if (isRotated.value) return
  setTimeout(() => isRotated.value = false, 500)
  isRotated.value = true
  props.value = { ...defaultProps.value }
  updateRendererDebounced()
}
</script>

<template>
  <div class="relative flex grow">
    <ComponentPreview class="grow h-full" />
    <div class="flex gap-2 absolute top-2 right-2">
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

  <div class="bg-(--ui-bg) w-md flex flex-col overflow-y-auto border-l border-(--ui-border)">
    <UTabs
      variant="link"
      :items="tabs"
      class="relative h-screen"
      :ui="{ list: 'sticky top-0 bg-(--ui-bg) border-b border-(--ui-border) z-50', content: 'h-full' }"
    >
      <template #props>
        <div
          v-for="prop in componentMeta?.meta.props"
          :key="componentMeta.componentId + '-prop-' + prop.name"
          class="px-3 py-2 border-b border-(--ui-border)"
        >
          <ComponentPropInput
            v-model="props[prop.name]"
            :schema="prop.schema"
            :name="prop.name"
            :description="prop.description"
            :default="prop.default"
            class="p-4 rounded"
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
