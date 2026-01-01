<script setup lang="ts">
import type { Component, ComponentExample, ComponentCollection, PropertyMeta, ComponentMeta } from '@compodium/core'
import { StorageSerializers, useColorMode, useDebounceFn, useStorage } from '@vueuse/core'
import type { ComboItem } from '../components/ComboInputMenu.vue'
import { getEnumOptions } from '~/utils/enum'

const { hooks } = useCompodiumClient()
const rendererMounted = ref(false)

const events = ref<{ name: string, data?: any }[]>([])
const collections = useStorage<ComponentCollection[]>('__compodium-collections', null, undefined, { serializer: StorageSerializers.object })

hooks.hook('renderer:mounted', () => {
  rendererMounted.value = true
  hooks.hook('component:event', async (payload) => {
    events.value.unshift(payload)
  })
})

hooks.hook('collections:resolved', async (cols) => {
  collections.value = cols

  const isComponentFound = component.value && collections?.value.some(col =>
    col.components.some(comp =>
      comp.pascalName === component.value?.pascalName
      || comp.examples?.some(ex => ex.pascalName === component.value?.pascalName)
    )
  )

  if (!isComponentFound) {
    const fallbackCollection = collections.value.find(c => c.components.length > 0)
    component.value = fallbackCollection?.components?.[0]
    if (!component.value) await navigateTo(`/welcome`)
  }

  updateComponent()
})

hooks.hook('component:updated', async (_, meta) => {
  componentMeta.value = meta
  console.log(meta)
})

const component = useStorage<(Component & Partial<ComponentExample>) | undefined>('__compodium-component', null, undefined, { serializer: StorageSerializers.object })

const props = useState<Record<string, any>>('__component_state', () => ref({}))
const defaultProps = shallowRef({})

const touched = ref(false)

watch(component, () => {
  touched.value = false
  events.value = []
})

// TODO
const componentMeta = ref<ComponentMeta>()

function getDefaultProps(meta?: ComponentMeta): Record<string, any> {
  if (!meta) return {}
  return meta.props?.reduce((acc: Record<string, any>, prop: any) => {
    const value = evalPropValue(prop)
    if (value !== undefined) acc[prop.name] = value
    return acc
  }, {}) ?? {}
}

function evalPropValue(meta: Partial<PropertyMeta>) {
  if (!meta.default) return
  try {
    return new Function(`return ${meta.default}`)()
  } catch {
    return
  }
}

const compodiumDefaultProps = computed(() => {
  if (!component.value || !componentMeta.value) return {}
  return { ...getDefaultProps(componentMeta.value), ...component.value?.defaultProps }
})

watch([compodiumDefaultProps], async () => {
  if (!component.value) return
  if (!touched.value) {
    props.value = compodiumDefaultProps.value
    combo.value = component.value?.combo
  }

  await updateComponent()
})

watch(component, async (oldValue, newValue) => {
  if (oldValue?.pascalName === newValue?.pascalName) updateComponent()
})

async function updateComponent() {
  if (!component.value) return

  // TODO: The schema can be clarified by specifying an optional examplePath attribute.
  await hooks.callHook('renderer:update-component', {
    path: component.value.realPath,
    props: props.value,
    wrapper: component.value?.wrapperComponent,
    events: componentMeta.value?.events,
    componentPath: component.value.componentPath ?? component.value.realPath
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
  return componentMeta.value?.props?.flatMap((prop) => {
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

watch([componentMeta, combo], async () => {
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
    { label: 'Tests', slot: 'tests', icon: 'lucide:flask-conical' },
    { label: 'Code', slot: 'code', icon: 'lucide:code' }
  ]
})
</script>

<template>
  <div
    ref="container"
    class="relative flex w-screen h-screen"
  >
    <div class="hidden xl:flex xl:w-xs h-full flex-col justify-between pt-1 border-r border-default bg-elevated/50">
      <ComponentCollectionMenu
        v-if="collections?.length"
        v-model="component"
        :collections="collections"
        class="overflow-y-scroll"
      />

      <TestMenu
        v-if="collections?.length"
        class="bg-elevated mx-2 mb-2 rounded"
      />
    </div>

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
          <ComboInputMenu
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
          <ComponentPropsTab
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
          <ComponentEventsTab :events="events" />
        </template>

        <template #tests>
          <ComponentTestsTab
            :key="component?.pascalName"
            :component="component"
          />
        </template>

        <template #code>
          <ComponentCodeTab
            :component="component"
            :props="props"
            :default-props="defaultProps"
          />
        </template>
      </UTabs>
    </div>
  </div>
</template>
