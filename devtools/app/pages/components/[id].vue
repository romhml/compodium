<script setup lang="ts">
import { useColorMode, useDebounceFn } from '@vueuse/core'
import { useFuse } from '@vueuse/integrations/useFuse'
import type { ComponentMeta, CompodiumHooks } from '#module/types'
import type { PropertyMeta } from '@compodium/meta'
import { camelCase, pascalCase } from 'scule'
import { createHooks } from 'hookable'
import type { ComboItem } from '../../components/ComboInput.vue'
import { getEnumOptions } from '~/utils/enum'
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
  if (!exampleId.value || component.value?.collectionId !== 'components') return
  const example = await $fetch<ComponentMeta>(`/api/component-meta/${exampleId.value}`, { baseURL: '/__compodium__' })
  return example
}, { watch: [exampleId] })

const combo = ref<string[]>([])

const comboProps = computed<Partial<[ComboItem, ComboItem]>>({
  get() {
    return [
      comboItems.value?.find(i => i.value === combo.value[0]),
      comboItems.value?.find(i => i.value === combo.value[1])
    ]
  },
  set(value) {
    combo.value = value?.map(c => c?.value ?? null) as [string, string] ?? [null, null]
  }
})

const comboItems = computed<ComboItem[]>(() => {
  return componentMeta.value?.meta?.props.flatMap((prop: PropertyMeta) => {
    if (!Array.isArray(prop.schema)) return
    const enumInput = prop.schema?.find((sch: any) => sch?.inputType === 'stringEnum')
    if (enumInput) {
      const options = getEnumOptions(enumInput.schema)
      return options?.length > 1
        ? [{ value: prop.name, label: prop.name, options }]
        : []
    }
    return []
  })
})

watch([componentMeta, exampleMeta, combo], async () => {
  await hooks.callHook('renderer:update-combo', { props: comboProps.value?.filter(Boolean) as ComboItem[] ?? [] })
}, { deep: true })

watch([exampleMeta, componentMeta], async ([newExampleMeta, newComponentMeta], [oldExampleMeta, oldComponentMeta]) => {
  if (!newComponentMeta) return

  // Don't refresh props if the change was initiated by HMR
  if (
    newComponentMeta?.componentId === oldComponentMeta?.componentId
    && newExampleMeta?.pascalName === oldExampleMeta?.pascalName
  ) return

  combo.value = [...(newExampleMeta?.meta?.compodium?.combo ?? newComponentMeta?.meta?.compodium?.combo ?? [])]

  defaultProps.value = {
    ...getDefaultProps(newComponentMeta),
    ...(newExampleMeta?.meta?.compodium?.defaultProps ?? newComponentMeta?.meta?.compodium?.defaultProps)
  }
  props.value = { ...defaultProps.value }
  await updateComponent()
})

watch(combo, () => combo.value?.forEach(name => props.value[name] = undefined))

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

  await hooks.callHook('renderer:update-combo', { props: comboProps.value?.filter(Boolean) as ComboItem[] ?? [] })
}

const updatePropsDebounced = useDebounceFn(
  () => hooks.callHook('renderer:update-props', { props: { ...props.value } }),
  100, { maxWait: 300 }
)

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

    <div
      v-if="comboItems?.length"
      class="flex justify-center items-center gap-1 absolute top-2 inset-x-1/2 -translate-x-1/2"
    >
      <ComboInput
        v-model="comboProps"
        :items="comboItems"
      />
    </div>

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

      <UPopover
        mode="hover"
        :ui="{ content: 'bg-transparent border-none shadow-none ring-0' }"
      >
        <UButton
          icon="lucide:grid"
          variant="link"
          class="rounded-full"
          color="neutral"
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

          <p class="text-(--ui-text-muted) text-right text-xs mt-1">
            {{ gridGap }}px
          </p>
        </template>
      </UPopover>

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
          <div class="bg-(--ui-bg) p-0.5 border-y border-(--ui-border) sticky top-0 z-1 flex gap-0.5">
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
              title="JSON Editor"
            >
              <USlideover
                ref="modal"
                class="rounded"
                close-icon="i-lucide-arrow-right"
                :ui="{
                  body: 'p-0 sm:p-0',
                  header: 'px-4 py-1.5 sm:py-1.5 sm:px-4 min-h-8 flex justify-between',
                  close: 'top-1'
                }"
                :overlay="false"
                title="JSON Editor"
              >
                <template #close>
                  <UButton
                    size="sm"
                    icon="i-lucide-arrow-right"
                    color="neutral"
                    variant="ghost"
                  />
                </template>
                <UButton
                  icon="lucide:braces"
                  variant="link"
                  color="neutral"
                  size="sm"
                />
                <template #body>
                  <JsonEditor
                    v-model="props"
                    class="h-full"
                    @update:model-value="updatePropsDebounced"
                  />
                </template>
              </USlideover>
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
              :disabled="combo.includes(prop.name)"
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
