<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { ComponentMeta, ComponentExample } from '#module/types'
import { generateComponentCode } from '@/utils/codegen'

const props = defineProps<{ example?: string, component?: ComponentMeta | ComponentExample, props?: Record<string, any> }>()

const fetch = $fetch.create({ baseURL: '/__compodium__/api' })
const { data: exampleCode } = useAsyncData<string | null>('__compodium-component-example-code', async () => {
  if (props.example) {
    return await fetch<string>(`/__compodium__/api/example/${props.example}`)
  }
  return null
}, { watch: [() => props.example] })

const code = computed(() => {
  if (!props.component) return

  const defaultProps = props.component?.meta?.props.reduce((acc: Record<string, any>, prop: any) => {
    acc[prop.name] = prop.default
    return acc
  }, {} as Record<string, any>)

  console.log(props.component.pascalName)

  if (props.example && exampleCode.value) {
    return updateComponentCode(props.component.pascalName, exampleCode.value, props.props, defaultProps)
  }
  // Need to filter default values
  return generateComponentCode(props.component.pascalName, props.props, defaultProps)
})

const { $prettier } = useNuxtApp()
const { data: formattedCode } = useAsyncData('__compodium-component-formatted-code', async () => {
  if (!code.value) return
  return await $prettier.format(code.value, {
    semi: false,
    singleQuote: true,
    printWidth: 50
  })
}, { watch: [code] })

const { codeToHtml } = useShiki()
const { data: highlightedCode } = useAsyncData('__compodium-component-highlighted-code', async () => {
  return formattedCode.value
    ? codeToHtml(formattedCode.value, 'vue')
    : undefined
}, { watch: [formattedCode] })

const { copy, copied } = useClipboard()
</script>

<template>
  <div class="relative text-wrap overflow-x-wrap bg-(--ui-bg-elevated)/50">
    <!-- eslint-disable vue/no-v-html -->
    <pre
      class="p-4 text-sm overflow-y-auto rounded-lg"
      v-html="highlightedCode"
    />
    <UButton
      color="neutral"
      size="sm"
      variant="link"
      :icon="copied ? 'i-lucide-clipboard-check' : 'i-lucide-clipboard'"
      class="absolute top-2 right-2"
      @click="copy(formattedCode ?? '')"
    />
  </div>
</template>
