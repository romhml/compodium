<script setup lang="ts">
import { useColorMode, useDebounceFn, watchDebounced } from '@vueuse/core'
import type { Component, ComponentCollection, ComponentExample } from '../../src/types'
import type { PropertyMeta } from 'vue-component-meta'
import Fuse from 'fuse.js'

// Disable devtools in component renderer iframe
// @ts-expect-error - Nuxt Devtools internal value
window.__NUXT_DEVTOOLS_DISABLE__ = true

const fetch = $fetch.create({ baseURL: '/__compodium__/api' })

function parseComponentMeta(component: Component): Component {
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

const componentKey = useState<string>('__compodium-component-name')
const componentMetaId = useState<string>('__compodium-meta-id')

const { data: collections, status } = useAsyncData('__compodium-fetch-collection', async () => {
  const collections = await fetch<Record<string, ComponentCollection>>('/collections')

  if (!collections || typeof collections !== 'object') {
    createError('Could not load collections')
    return null
  }

  if (collections && !componentKey.value) {
    const fallbackCollection = Object.values(collections).find(c => c.components && Object.values(c.components).length > 0)
    const fallbackComponent = fallbackCollection ? Object.values(fallbackCollection.components)[0] : undefined

    componentKey.value = fallbackComponent?.pascalName
    componentMetaId.value = fallbackComponent?.pascalName
  }
  return collections
})

const componentsState = useState<Record<string, Record<string, any>>>('__component_state', () => ({}))

const treeItems = computed(() => {
  if (!collections.value) return
  return Object.entries(collections.value).map(([key, value]) => {
    return {
      label: key,
      key,
      icon: value.icon,
      defaultOpen: true,
      isCollection: true,
      children: value
        ? Object.entries(value.components).map(([ckey, cvalue]) => {
            const examples = cvalue.examples?.map((example: ComponentExample) => ({
              label: example.pascalName.replace(`${key}${ckey}`, ''),
              metaId: ckey,
              key: example.pascalName,
              isExample: true
            }))

            const mainExample = examples?.find((c: any) => {
              return c.label === '' || c.label === 'Example'
            })

            const children = examples?.filter((e: any) => e.key !== mainExample?.key)
            return {
              label: ckey,
              key: mainExample?.key ?? ckey,
              children: children?.length ? children : undefined,
              metaId: ckey
            }
          })
        : undefined
    }
  })
})

function flattenTreeItems(item: Record<string, any>): Record<string, any>[] {
  if (!item) return []
  return [item, ...(item.children?.flatMap(flattenTreeItems) ?? [])]
}

const flattenedTreeItems = computed(() => Object.values(treeItems.value ?? {}).flatMap(flattenTreeItems))
const treeValue = computed({
  get: () => flattenedTreeItems.value.find(i => i.key === componentKey.value),
  set(value: Record<string, any>) {
    if (!value || value.isCollection) return
    componentKey.value = value.key
    componentMetaId.value = value.metaId
  }
})

const { data: componentMeta, refresh: refreshMeta } = useAsyncData(`__compodium-fetch-meta-${componentMetaId.value}`, async () => {
  if (!componentMetaId.value) return
  const meta = await fetch<Component>(`/component-meta/${componentMetaId.value}`)
  return parseComponentMeta(meta)
}, { watch: [componentMetaId] })

const componentProps = ref<Record<string, any>>({})

watch(componentKey, () => {
  if (!componentMeta.value) return
  componentProps.value = componentsState.value[componentKey.value] ??= {}
  updateRendererComponent()
}, { immediate: true })

function updateRendererComponent() {
  if (!componentMeta.value) return
  const event: Event & { data?: { component?: string, props?: any } } = new Event('compodium:update-component')
  event.data = { component: componentKey.value, props: componentProps.value }
  window.dispatchEvent(event)
}

function updateRenderer() {
  if (!componentMeta.value) return
  const event: Event & { data?: any } = new Event('compodium:update-props')

  event.data = {
    props: componentProps.value
  }
  window.dispatchEvent(event)
}

const updateRendererDebounced = useDebounceFn(updateRenderer, 100, { maxWait: 300 })
function onComponentLoaded() {
  updateRenderer()
}

const refreshMetaDebounced = useDebounceFn(refreshMeta, 300)
async function onMetaReload() {
  await refreshMetaDebounced()
}

onMounted(() => {
  window.addEventListener('compodium:renderer-mounted', updateRendererComponent)
  window.addEventListener('compodium:component-loaded', onComponentLoaded)
  window.addEventListener('compodium:meta-reload', onMetaReload)
})

onUnmounted(() => {
  window.removeEventListener('compodium:renderer-mounted', updateRendererComponent)
  window.removeEventListener('compodium:component-loaded', onComponentLoaded)
  window.removeEventListener('compodium:meta-reload', onMetaReload)
})

const tabs = computed(() => {
  if (!componentMeta.value) return
  return [
    { label: 'Props', slot: 'props', icon: 'i-lucide-settings', disabled: !componentMeta.value.meta?.props?.length }
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

// function openDocs() {
//   if (!component.value) return
//   window.parent.open(`https://ui3.nuxt.dev/components/${component.value.slug}`)
// }

const searchInput = useTemplateRef('search')
const componentNames = computed(() => flattenedTreeItems.value.filter(c => !c.isCollection && !c.isExample).map(c => c.label))
const fuse = computed(() => new Fuse(componentNames.value ?? [], { threshold: 0.4, shouldSort: true }))
const searchTerm = ref()

const filteredComponents = shallowRef()
const filteredComponentsSet = computed(() => new Set(filteredComponents.value))

watchDebounced(searchTerm, () => {
  filteredComponents.value = fuse.value?.search(searchTerm.value).map(i => i.item)
}, { debounce: 400 })

defineShortcuts({
  ctrl_f: {
    usingInput: true,
    handler: () => {
      searchInput.value?.inputRef?.focus()
    }
  }
})

function filterTreeItems(item: Record<string, any>) {
  if (!filteredComponents.value || searchTerm.value === '' || !item.isCollection) return item.children
  return item.children?.filter((c: any) => filteredComponentsSet.value.has(c.label))
}

function selectFirstResult() {
  const result = filteredComponents.value?.[0]
  const component = flattenedTreeItems.value?.find(c => c.label === result)
  if (result && component) {
    componentKey.value = component?.key
    componentMetaId.value = component.metaId
  }
}
</script>

<template>
  <UApp class="flex justify-center items-center h-screen w-full relative font-sans">
    <template v-if="status === 'success'">
      <div class="absolute top-0 bottom-0 inset-x-0 grid xl:grid-cols-8 grid-cols-4 bg-[var(--ui-bg)]">
        <div class="col-span-1 border-r border-[var(--ui-border)] hidden xl:block overflow-y-auto p-2">
          <UInput
            ref="search"
            v-model.trim="searchTerm"
            class="w-full mb-4"
            type="search"
            variant="none"
            leading-icon="lucide:search"
            size="md"
            placeholder="Search"
            aria-keyshortcuts="Meta+F"
            @keydown.enter="selectFirstResult"
          >
            <template #trailing>
              <UKbd
                variant="subtle"
                value="meta"
              />
              <UKbd
                variant="subtle"
                value="F"
              />
            </template>
          </UInput>
          <UTree
            v-model="treeValue"
            :items="treeItems"
            size="xl"
            parent-trailing-icon="lucide:chevron-down"
            :ui="{ itemTrailingIcon: 'group-data-[expanded]:rotate-180 transition-transform duration-200 ml-auto' }"
            :get-children="filterTreeItems"
          >
            <template #item-leading="{ hasChildren, expanded, item }">
              <UIcon
                v-if="item.icon"
                :name="item.icon"
                size="lg"
              />
              <UIcon
                v-else-if="hasChildren && expanded && item.isCollection"
                name="lucide:folder-open"
                size="lg"
              />
              <UIcon
                v-else-if="hasChildren && item.isCollection"
                name="lucide:folder"
                size="lg"
              />
            </template>
          </UTree>
        </div>

        <div class="xl:col-span-5 col-span-2 relative">
          <div class="flex flex-col h-full bg-grid rounded-md">
            <ComponentPreview
              :component="componentMeta"
              :props="componentProps"
              class="grow h-full"
            />
            <ComponentCode
              :component="componentMeta"
              :example="componentKey !== componentMetaId ? componentKey : undefined"
              :props="componentProps"
            />
          </div>
          <div class="flex gap-2 absolute top-1 right-2">
            <UButton
              :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
              variant="ghost"
              color="neutral"
              @click="isDark = !isDark"
            />
          </div>

          <!-- <UButton -->
          <!--   v-if="component.docUrl" -->
          <!--   variant="ghost" -->
          <!--   color="neutral" -->
          <!--   icon="i-lucide-external-link" -->
          <!--   @click="openDocs()" -->
          <!-- > -->
          <!--   Open docs -->
          <!-- </UButton> -->
        </div>

        <div class="border-l border-[var(--ui-border)] flex flex-col col-span-2 overflow-y-auto">
          <UTabs
            color="neutral"
            variant="link"
            :items="tabs"
            class="relative"
            :ui="{ list: 'sticky top-0 bg-[var(--ui-bg)] z-50' }"
          >
            <template #props>
              <div
                v-for="prop in componentMeta?.meta.props"
                :key="'prop-' + prop.name"
                class="px-3 py-5 border-b border-[var(--ui-border)]"
              >
                <ComponentPropInput
                  v-model="componentProps[prop.name]"
                  :meta="prop"
                  @update:model-value="updateRendererDebounced"
                />
              </div>
            </template>
          </UTabs>
        </div>
      </div>
    </template>
  </UApp>
</template>
