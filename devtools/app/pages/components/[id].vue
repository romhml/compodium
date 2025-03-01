<script setup lang="ts">
import { useColorMode, useDebounceFn } from '@vueuse/core'
import type { ComponentMeta, CompodiumHooks } from '#module/types'
import type { PropertyMeta } from 'vue-component-meta'
import { camelCase, pascalCase } from 'scule'
import { createHooks } from 'hookable'

// Disable devtools in component renderer iframe
// @ts-expect-error - Nuxt Devtools internal value
window.__NUXT_DEVTOOLS_DISABLE__ = true

const route = useRoute()

const componentId = computed(() => camelCase(route.params.id as string))
const exampleId = computed(() => camelCase(route.query.example as string))

const props = useState<Record<string, any>>('__component_state', () => ({}))

const defaultProps = shallowRef({})
const compodiumDefaultProps = shallowRef({})

const { fetchCollections, getComponent } = useCollections()

const component = computed(() => {
  const baseComponent = getComponent(componentId.value)
  return baseComponent.examples?.find((e: any) => e.pascalName === pascalCase(exampleId.value)) ?? baseComponent
})

function getDefaultProps(component: ComponentMeta): Record<string, any> {
  return component.meta?.props?.reduce((acc: Record<string, any>, prop: any) => {
    const value = evalPropValue(prop)
    if (value !== undefined) acc[prop.name] = value
    return acc
  }, {})
}

function evalPropValue(meta: Partial<PropertyMeta>) {
  if (!meta.default) return
  try {
    return new Function(`return ${meta.default}`)()
  } catch {
    console.warn(`[Compodium] Could not evaluate default value for property ${meta.name}`)
  }
}

const { data: componentMeta, refresh: refreshComponentMeta } = useAsyncData('__compodium-fetch-meta', async () => {
  const component = await $fetch<ComponentMeta>(`/api/component-meta/${componentId.value}`, { baseURL: '/__compodium__' })
  return component
}, { watch: [componentId] })

const { data: exampleMeta } = useAsyncData('__compodium-fetch-example-meta', async () => {
  const example = await $fetch<ComponentMeta>(`/api/component-meta/${exampleId.value}`, { baseURL: '/__compodium__' })
  return example
}, { watch: [exampleId] })

watch([exampleMeta, componentMeta], ([newExampleMeta, newComponentMeta], [oldExampleMeta, oldComponentMeta]) => {
  if (!newComponentMeta) return

  // Don't refresh props if the change was initiated by HMR
  if (
    newComponentMeta?.componentId === oldComponentMeta?.componentId
    && newExampleMeta?.pascalName === oldExampleMeta?.pascalName
  ) return

  defaultProps.value = {
    ...getDefaultProps(newComponentMeta),
    ...(newExampleMeta?.meta?.compodium?.defaultProps ?? newComponentMeta?.meta?.compodium?.defaultProps)
  }

  updateComponent()
  updateRenderer()
})

watch(component, async (oldValue, newValue) => {
  if (oldValue.componentId === newValue.componentId) updateComponent()
})

async function updateComponent() {
  props.value = { ...defaultProps.value }
  await hooks.callHook('renderer:update-component', {
    collectionId: component.value.collectionId,
    componentId: component.value.componentId,
    baseName: component.value.baseName,
    path: component.value.filePath
  })
}

async function updateRenderer() {
  await hooks.callHook('renderer:update-props', { props: props.value })
}

const updateRendererDebounced = useDebounceFn(updateRenderer, 100, { maxWait: 300 })

const hooks = createHooks<CompodiumHooks>()

hooks.hook('renderer:mounted', () => hooks.callHook('renderer:update-component', {
  collectionId: component.value.collectionId,
  componentId: component.value.componentId,
  baseName: component.value.baseName,
  path: component.value.filePath
}))

hooks.hook('renderer:component-loaded', updateRenderer)

hooks.hook('component:added', useDebounceFn(async () => {
  await Promise.all([
    $fetch('/api/reload-meta', { baseURL: '/__compodium__' }),
    fetchCollections()
  ])
}, 300))

hooks.hook('component:removed', useDebounceFn(fetchCollections, 300))
hooks.hook('component:changed', useDebounceFn(() => refreshComponentMeta(), 300))

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
  props.value = { ...defaultProps.value, ...compodiumDefaultProps.value }
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

  <div class="bg-(--ui-bg) w-md border-l border-(--ui-border)">
    <UTabs
      variant="link"
      :items="tabs"
      class="relative h-screen flex flex-col overflow-y-scroll gap-0"
      :ui="{ list: 'sticky top-0 bg-(--ui-bg) border-b border-(--ui-border) z-50', content: 'grow' }"
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
            class="p-4 rounded"
            @update:model-value="updateRendererDebounced"
          />
        </div>
      </template>

      <template #code>
        <ComponentCode
          class=""
          :component="componentMeta"
          :example="exampleId"
          :props="props"
          :default-props="defaultProps"
        />
      </template>
    </UTabs>
  </div>
</template>
