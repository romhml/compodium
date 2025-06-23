<script setup lang="ts">
import type { Component, ComponentExample, CompodiumMeta, ComponentCollection, PropertyMeta } from '@compodium/core'
import { StorageSerializers, useColorMode, useDebounceFn, useStorage } from '@vueuse/core'
import type { ComboItem } from '../components/ComboInput.vue'
import { getEnumOptions } from '~/utils/enum'

const { hooks } = useCompodiumClient()
const rendererMounted = ref(false)

const events = ref<{ name: string, data?: any }[]>([])

hooks.hook('renderer:mounted', () => {
  rendererMounted.value = true
  hooks.hook('component:changed', async (path: string) => {
    if (
      (component.value?.filePath && path.endsWith(component.value?.filePath))
      || (component.value?.componentPath && path.endsWith(component.value?.componentPath))) {
      await Promise.all([refreshMeta(), refreshExampleMeta()])
    }
  })

  hooks.hook('component:removed', useDebounceFn(async () => {
    await refreshCollections()
  }, 300))

  hooks.hook('component:added', useDebounceFn(async () => {
    await refreshCollections()
  }, 300))

  hooks.hook('component:event', async (payload) => {
    events.value.unshift(payload)
  })

  updateComponent()
})

const { data: collections, refresh: refreshCollections } = useAsyncData(async () => {
  const collections = await $fetch<ComponentCollection[]>('/api/collections', { baseURL: '/__compodium__' })

  const isComponentFound = component.value && collections.some(col =>
    col.components.some(comp =>
      comp.pascalName === component.value?.pascalName
      || comp.examples?.some(ex => ex.pascalName === component.value?.pascalName)
    )
  )

  if (!isComponentFound) {
    const fallbackCollection = collections.find(c => c.components.length > 0)
    component.value = fallbackCollection?.components?.[0]
    if (!component.value) {
      await navigateTo(`/welcome`)
    }
  }

  return collections
})

const component = useStorage<(Component & Partial<ComponentExample>) | undefined>('__compodium-component', null, undefined, { serializer: StorageSerializers.object })

const props = useState<Record<string, any>>('__component_state', () => ref({}))
const defaultProps = shallowRef({})
const compodiumDefaultProps = shallowRef({})
const touched = ref(false)

watch(component, () => {
  touched.value = false
  events.value = []
})

function getDefaultProps(meta: CompodiumMeta): Record<string, any> {
  return meta.props?.reduce((acc: Record<string, any>, prop: any) => {
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
    return
  }
}

const { data: componentMeta, refresh: refreshMeta } = useAsyncData('__compodium-fetch-meta', async () => {
  if (!component.value) return
  const meta = await $fetch<CompodiumMeta>('/api/meta', { baseURL: '/__compodium__', query: {
    component: component.value?.componentPath ?? component.value?.filePath }
  })
  return meta
}, { watch: [component] })

const { data: exampleMeta, refresh: refreshExampleMeta } = useAsyncData('__compodium-fetch-example-meta', async () => {
  if (!component.value || !component.value.isExample) return
  const example = await $fetch<CompodiumMeta>(`/api/meta`, { baseURL: '/__compodium__', query: { component: component.value.filePath } })
  return example
}, { watch: [component] })

watch([componentMeta, exampleMeta], async ([newComponentMeta, newExampleMeta]) => {
  if (!newComponentMeta) return

  compodiumDefaultProps.value = { ...(newExampleMeta?.compodium?.defaultProps ?? newComponentMeta?.compodium?.defaultProps) }
  defaultProps.value = {
    ...getDefaultProps(newComponentMeta)
  }

  if (!touched.value) {
    props.value = structuredClone({ ...defaultProps.value, ...compodiumDefaultProps.value })

    combo.value = [...(
      newExampleMeta?.compodium?.combo
      ?? newComponentMeta?.compodium?.combo as any
      ?? []
    )]
  }

  await updateComponent()
})

watch(component, async (oldValue, newValue) => {
  if (oldValue?.pascalName === newValue?.pascalName) updateComponent()
})

async function updateComponent() {
  if (!component.value) return

  await hooks.callHook('renderer:update-component', {
    path: component.value.realPath,
    props: props.value,
    wrapper: component.value?.wrapperComponent,
    events: componentMeta.value?.events
  })

  await hooks.callHook('renderer:update-combo', { props: comboProps.value?.filter(Boolean) as ComboItem[] ?? [] })
}

const updatePropsDebounced = useDebounceFn(
  () => hooks.callHook('renderer:update-props', { props: { ...props.value } }),
  100, { maxWait: 300 }
)

const combo = ref<string[]>([])
const comboProps = computed<Partial<[ComboItem, ComboItem]>>({
  get() {
    return [
      comboItems.value?.find(i => i?.value === combo.value[0]),
      comboItems.value?.find(i => i?.value === combo.value[1])
    ]
  },
  set(value) {
    combo.value = value?.map(c => c?.value ?? null) as [string, string] ?? [null, null]
  }
})

const comboItems = computed<ComboItem[]>(() => {
  return componentMeta.value?.props.flatMap((prop) => {
    if (!Array.isArray(prop.schema)) return []
    const enumInput = prop.schema?.find((sch: any) => sch?.inputType === 'stringEnum')

    if (enumInput) {
      const options = getEnumOptions(enumInput.schema as any)
      return options?.length > 1
        ? [{ value: prop.name, label: prop.name, options }]
        : []
    }

    return []
  }) ?? []
})

watch([componentMeta, exampleMeta, combo], async () => {
  await hooks.callHook('renderer:update-combo', { props: comboProps.value?.filter(Boolean) as ComboItem[] ?? [] })
}, { deep: true })

watch(combo, () => combo.value?.forEach(name => props.value[name] = undefined))

const showGrid = ref(false)
const gridGap = ref<number>(8)
const updateGridDebounced = useDebounceFn(() => {
  hooks.callHook('renderer:grid', { enabled: showGrid.value, gap: gridGap.value })
}, 50, { maxWait: 50 })

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

const tabs = computed(() => {
  return [
    { label: 'Props', slot: 'props', icon: 'lucide:settings' },
    { label: 'Events', slot: 'events', icon: 'lucide:chart-no-axes-gantt' },
    { label: 'Code', slot: 'code', icon: 'lucide:code' }
  ]
})
</script>

<template>
  <div
    ref="container"
    class="relative flex w-screen h-screen"
  >
    <ComponentCollectionMenu
      v-if="collections?.length"
      v-model="component"
      :collections="collections"
      class="pt-1 border-r border-default hidden xl:block xl:w-xs overflow-y-scroll"
    />

    <div class="grow relative">
      <div class="grid grid-cols-3 absolute inset-x-0 p-2 z-1">
        <div>
          <ComponentSearchMenu
            v-if="collections?.length"
            v-model="component"
            :collections="collections"
          />
        </div>

        <div class="flex justify-center items-center">
          <ComboInput
            v-if="comboItems?.length"
            v-model="comboProps"
            :items="comboItems"
            @update:model-value="touched = true"
          />
        </div>

        <div class="flex gap-2 justify-end">
          <UTooltip
            text="Open docs"
            :content="{ side: 'left' }"
          >
            <UButton
              v-if="component?.docUrl"
              icon="lucide:book-open"
              variant="link"
              class="rounded-full"
              color="neutral"
              :href="component?.docUrl"
              target="_blank"
            />
          </UTooltip>

          <UPopover
            mode="hover"
            :ui="{ content: 'bg-transparent border-none shadow-none ring-0' }"
          >
            <UButton
              icon="lucide:grid"
              variant="link"
              class="rounded-full"
              :color="showGrid ? 'primary' : 'neutral'"
              :disabled="!rendererMounted"
              @click="() => {
                showGrid = !showGrid
                updateGridDebounced()
              }"
            />

            <template #content>
              <USlider
                v-model="gridGap"
                size="xs"
                class="w-28"
                :min="4"
                :max="64"
                :step="1"
                @update:model-value="() => {
                  showGrid = true
                  updateGridDebounced()
                }"
              />

              <p class="text-muted text-right text-xs mt-1">
                {{ gridGap }}px
              </p>
            </template>
          </UPopover>

          <UButton
            :icon="isDark ? 'lucide:moon' : 'lucide:sun'"
            variant="link"
            class="rounded-full"
            color="neutral"
            :disabled="!rendererMounted"
            @click="isDark = !isDark"
          />
        </div>
      </div>

      <div class="absolute inset-0 flex justify-center items-center">
        <iframe
          v-show="rendererMounted"
          class="w-full h-full"
          src="/__compodium__/renderer"
        />
        <UIcon
          v-if="!rendererMounted"
          name="lucide:loader-circle"
          class="m-auto animate-rotate text-accented"
          size="20"
        />
      </div>
    </div>

    <div class="bg-neutral w-md border-l border-default">
      <UTabs
        variant="link"
        :items="tabs"
        class="h-screen flex flex-col gap-0"
        :ui="{ content: 'grow relative overflow-y-scroll' }"
      >
        <template #props>
          <ComponentProps
            v-model="props"
            :meta="componentMeta"
            :disabled="combo"
            :default-value="{ ...defaultProps, ...compodiumDefaultProps }"
            @update:model-value="() => {
              touched = true
              updatePropsDebounced()
            }"
          />
        </template>

        <template #events>
          <ComponentEvents :events="events" />
        </template>

        <template #code>
          <ComponentCode
            :component="component"
            :props="props"
            :default-props="defaultProps"
          />
        </template>
      </UTabs>
    </div>
  </div>
</template>
