<script setup lang="ts">
import { useColorMode, useDebounceFn } from '@vueuse/core'
import type { Component, ComponentCollection, ComponentExample } from '../../src/types'
import type { PropertyMeta } from 'vue-component-meta'

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

const { data: collections, status } = useAsyncData('__compodium-fetch-collection', async () => {
  return await fetch<Record<string, ComponentCollection>>('/collections')
})

const componentsState = useState<Record<string, Record<string, any>>>('__component_state', () => ({}))

const treeValue = ref()
const componentTree = computed(() => {
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
              metaId: ckey,
              isExample: !!mainExample
            }
          })
        : undefined
    }
  })
})

const componentName = useState<string>('__compodium-component-name')
const componentMetaId = useState<string>('__compodium-meta-id')
watch(treeValue, () => {
  if (!treeValue.value) return
  if (!treeValue.value?.isCollection) {
    componentName.value = treeValue.value.key
    componentMetaId.value = treeValue.value.metaId
  }
})

const { data: componentMeta, refresh: refreshMeta } = useAsyncData(`__compodium-fetch-meta-${componentMetaId.value}`, async () => {
  if (!componentMetaId.value) return
  const meta = await fetch<Component>(`/component-meta/${componentMetaId.value}`)
  return parseComponentMeta(meta)
}, { watch: [componentMetaId], immediate: false })

const componentProps = ref<Record<string, any>>({})
watch(componentName, () => {
  if (!componentMeta.value) return
  componentProps.value = componentsState.value[componentName.value] ??= {}
  updateRendererComponent()
}, { immediate: true })

function updateRendererComponent() {
  if (!componentMeta.value) return
  const event: Event & { data?: { component?: string, props?: any } } = new Event('compodium:update-component')
  event.data = { component: componentName.value, props: componentProps.value }
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
</script>

<template>
  <UApp class="flex justify-center items-center h-screen w-full relative font-sans">
    <template v-if="status === 'success'">
      <div class="absolute top-0 bottom-0 inset-x-0 grid xl:grid-cols-8 grid-cols-4 bg-[var(--ui-bg)]">
        <div class="col-span-1 border-r border-[var(--ui-border)] hidden xl:block overflow-y-auto p-2">
          <UTree
            v-model="treeValue"
            :items="componentTree"
            size="xl"
            parent-trailing-icon="lucide:chevron-down"
            :ui="{ itemTrailingIcon: 'group-data-[expanded]:rotate-180 transition-transform duration-200 ml-auto' }"
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
              :example="componentName !== componentMetaId ? componentName : undefined"
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

<style>
@import 'tailwindcss';
@import '@nuxt/ui';

@theme {
  --font-sans: 'DM Sans', sans-serif;

  --color-green-50: #EFFDF5;
  --color-green-100: #D9FBE8;
  --color-green-200: #B3F5D1;
  --color-green-300: #75EDAE;
  --color-green-400: #00DC82;
  --color-green-500: #00C16A;
  --color-green-600: #00A155;
  --color-green-700: #007F45;
  --color-green-800: #016538;
  --color-green-900: #0A5331;
  --color-green-950: #052E16;
}

.bg-grid {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='%23fff'/%3E%3Cpath fill='none' stroke='hsla(0, 0%25, 98%25, 1)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
  background-size: 40px 40px;
}

.dark .bg-grid {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='hsl(0, 0%25, 8.5%25)'/%3E%3Cpath fill='none' stroke='hsl(0, 0%25, 11.0%25)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
  background-size: 40px 40px;
}

.shiki
.shiki span {
  background-color: transparent !important;
}

html.dark .shiki,
html.dark .shiki span {
  color: var(--shiki-dark) !important;
  background-color: transparent !important;
  /* Optional, if you also want font styles */
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
</style>
