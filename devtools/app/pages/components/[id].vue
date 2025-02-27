<script setup lang="ts">
import { useColorMode, useDebounceFn } from '@vueuse/core'
import { useFuse } from '@vueuse/integrations/useFuse'
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
    const value = getDefaultPropValue(prop)
    if (value !== undefined) acc[prop.name] = value
    return acc
  }, {})
}

function getDefaultPropValue(meta: Partial<PropertyMeta>) {
  if (!meta.default) return
  try {
    return new Function(`return ${meta.default}`)()
  } catch {
    console.warn(`[Compodium] Could not evaluate default value for property ${meta.name}`)
  }
}

const { data: componentMeta, refresh: refreshComponent } = useAsyncData('__compodium-fetch-meta', async () => {
  const meta = await $fetch<ComponentMeta>(`/api/component-meta/${componentId.value}`, { baseURL: '/__compodium__' })
  defaultProps.value = getDefaultProps(meta)

  if (!componentMeta.value || componentMeta.value?.componentId !== componentId.value) {
    updateComponent()
  }

  return meta
}, { watch: [componentId] })

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

function onComponentLoaded() {
  updateRenderer()
}

async function updateDefaultProps(payload: { componentId: string, defaultProps: any }) {
  if (componentId.value !== payload.componentId) return
  props.value = { ...defaultProps.value, ...payload.defaultProps, ...props.value }
  compodiumDefaultProps.value = { ...payload.defaultProps }
  await hooks.callHook('renderer:update-props', { props: props.value })
}

const hooks = createHooks<CompodiumHooks>()

hooks.hook('renderer:mounted', () => hooks.callHook('renderer:update-component', {
  collectionId: component.value.collectionId,
  componentId: component.value.componentId,
  baseName: component.value.baseName,
  path: component.value.filePath
}))

hooks.hook('renderer:component-loaded', onComponentLoaded)

hooks.hook('component:added', useDebounceFn(async () => {
  await Promise.all([
    $fetch('/api/reload-meta', { baseURL: '/__compodium__' }),
    fetchCollections()
  ])
}, 300))

hooks.hook('component:removed', useDebounceFn(fetchCollections, 300))
hooks.hook('component:changed', useDebounceFn(() => refreshComponent(), 300))
hooks.hook('devtools:update-default-props', updateDefaultProps)

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

const componentProps = computed(() => componentMeta.value?.meta?.props ?? [])

const propsSearchTerm = ref()
const { results: fuseResults } = useFuse<PropertyMeta>(propsSearchTerm, componentProps, {
  fuseOptions: {
    ignoreLocation: true,
    threshold: 0.1,
    keys: ['name', 'description']
  },
  matchAllWhenSearchEmpty: true
})
const visibleProps = computed(() => new Set(fuseResults.value?.map(result => result.item.name)))
</script>

<template>
  <div class="relative flex grow">
    <ComponentPreview class="grow h-full" />
    <div class="flex gap-2 absolute top-2 right-2">
      <UTooltip
        text="Open docs"
        :content="{ side: 'left' }"
      >
        <UButton
          v-if="componentMeta?.docUrl"
          icon="lucide:book-open"
          variant="link"
          class="rounded-full"
          color="neutral"
          :href="componentMeta?.docUrl"
          target="_blank"
        />
      </UTooltip>
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
      class="h-screen flex flex-col gap-0"
      :ui="{ content: 'grow relative overflow-y-scroll' }"
    >
      <template #props>
        <div class="overflow-y-scroll h-full">
          <div class="bg-(--ui-bg) p-0.5 border-y border-(--ui-border) sticky top-0 z-1 flex gap-2">
            <UInput
              v-model="propsSearchTerm"
              placeholder="Search props..."
              icon="lucide:search"
              variant="none"
              class="w-full"
            />

            <UTooltip
              text="Reset props"
              :content="{ side: 'left' }"
            >
              <UButton
                icon="lucide:rotate-cw"
                variant="link"
                color="neutral"
                class="rounded-full"
                size="sm"
                :class="{ 'animate-rotate': isRotated }"
                @click="onResetState"
              />
            </UTooltip>
          </div>
          <div
            v-for="prop in componentMeta?.meta.props"
            v-show="visibleProps.has(prop.name)"
            :key="componentMeta.componentId + '-prop-' + prop.name"
            class="grow px-3 py-2 border-b border-(--ui-border)"
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
        </div>
      </template>

      <template #code>
        <ComponentCode
          :component="componentMeta"
          :example="exampleId"
          :props="props"
          :default-props="defaultProps"
        />
      </template>
    </UTabs>
  </div>
</template>
