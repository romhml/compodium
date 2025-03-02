<script setup lang="ts">
import { useColorMode, useDebounceFn } from '@vueuse/core'
import { useFuse } from '@vueuse/integrations/useFuse'
import type { ComponentMeta, CompodiumHooks } from '#module/types'
import type { PropertyMeta } from '@compodium/meta'
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
  return baseComponent?.examples?.find((e: any) => e.pascalName === pascalCase(exampleId.value)) ?? baseComponent
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
  if (!exampleId.value) return
  const example = await $fetch<ComponentMeta>(`/api/component-meta/${exampleId.value}`, { baseURL: '/__compodium__' })
  return example
}, { watch: [exampleId] })

watch([exampleMeta, componentMeta], async ([newExampleMeta, newComponentMeta], [oldExampleMeta, oldComponentMeta]) => {
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
  props.value = { ...defaultProps.value }
  await updateComponent()
})

watch(component, async (oldValue, newValue) => {
  if (oldValue.componentId === newValue.componentId) updateComponent()
})

async function updateComponent() {
  await hooks.callHook('renderer:update-component', {
    collectionId: component.value.collectionId,
    componentId: component.value.componentId,
    baseName: component.value.baseName,
    path: component.value.filePath,
    props: props.value
  })
}

const updatePropsDebounced = useDebounceFn(() => hooks.callHook('renderer:update-props', { props: props.value }), 100, { maxWait: 300 })

const hooks = createHooks<CompodiumHooks>()

hooks.hook('renderer:mounted', updateComponent)

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
  updatePropsDebounced()
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
watch(component, () => propsSearchTerm.value = '')
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
              class="w-full ml-1"
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
              inline
              class="p-3 rounded"
              @update:model-value="updatePropsDebounced"
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
