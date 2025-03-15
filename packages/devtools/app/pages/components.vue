<script setup lang="ts">
import type { Component, ComponentExample, CompodiumMeta, ComponentCollection, PropertyMeta } from '@compodium/core'
import { useColorMode, useDebounceFn } from '@vueuse/core'
import { useFuse } from '@vueuse/integrations/useFuse'
import type { ComboItem } from '../components/ComboInput.vue'
import { getEnumOptions } from '~/utils/enum'

const { hooks } = useCompodiumClient()
const rendererMounted = ref(false)
hooks.hook('renderer:mounted', () => {
  rendererMounted.value = true

  hooks.hook('component:changed', async (path: string) => {
    if (path === component.value?.filePath || path === component.value?.componentPath) {
      await Promise.all([refreshMeta(), refreshExampleMeta()])
    }
  })

  hooks.hook('component:removed', useDebounceFn(async () => {
    await refreshCollections()
  }, 300))

  hooks.hook('component:added', useDebounceFn(async () => {
    await refreshCollections()
  }, 300))

  updateComponent()
})

const { data: collections, refresh: refreshCollections } = useAsyncData(async () => {
  const collections = await $fetch<ComponentCollection[]>('/api/collections', { baseURL: '/__compodium__' })
  if (!component.value) {
    const fallbackCollection = collections?.[0]
    component.value = fallbackCollection?.components?.[0]
    if (!component.value) {
      await navigateTo(`/welcome`)
    }
  }
  return collections
})

const component = shallowRef<(Component & Partial<ComponentExample>) | undefined>()
const props = useState<Record<string, any>>('__component_state', () => ref({}))
const defaultProps = shallowRef({})
const compodiumDefaultProps = shallowRef({})

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
  combo.value = [...(
    newExampleMeta?.compodium?.combo
    ?? newComponentMeta?.compodium?.combo as any
    ?? []
  )]

  compodiumDefaultProps.value = { ...(newExampleMeta?.compodium?.defaultProps ?? newComponentMeta?.compodium?.defaultProps) }
  defaultProps.value = {
    ...getDefaultProps(newComponentMeta)
  }

  props.value = { ...defaultProps.value, ...compodiumDefaultProps.value }
  await updateComponent()
})

watch(component, async (oldValue, newValue) => {
  if (oldValue?.pascalName === newValue?.pascalName) updateComponent()
})

async function updateComponent() {
  if (!component.value) return

  await hooks.callHook('renderer:update-component', {
    path: component.value.realPath,
    props: props.value
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
    { label: 'Code', slot: 'code', icon: 'lucide:code' }
  ]
})

const isRotated = ref(false)
function onResetState() {
  if (isRotated.value) return
  setTimeout(() => isRotated.value = false, 500)
  isRotated.value = true
  props.value = { ...defaultProps.value, ...compodiumDefaultProps.value }
  updatePropsDebounced()
}

const componentProps = computed(() => componentMeta.value?.props ?? [])
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
  <div
    ref="container"
    class="relative flex w-screen h-screen overflow-y-scroll"
  >
    <ComponentCollectionMenu
      v-if="collections?.length"
      v-model="component"
      :collections="collections"
      class="pt-1 border-r border-(--ui-border) hidden xl:block xl:w-xs overflow-y-scroll"
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
          class="m-auto animate-rotate text-(--ui-bg-accented)"
          size="20"
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
                      @update:model-value="updatePropsDebounced()"
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
              v-for="prop in componentMeta?.props"
              v-show="visibleProps.has(prop.name)"
              :key="prop.name"
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
                @update:model-value="updatePropsDebounced()"
              />
            </div>
          </div>
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
