<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { Component, ComponentExample } from '@compodium/core'
import { generateComponentCode } from '@/utils/codegen'

const props = defineProps<{ example?: string, component?: Component | ComponentExample, props?: Record<string, any>, defaultProps?: Record<string, any> }>()

const fetch = $fetch.create({ baseURL: '/__compodium__/api' })
const { data: exampleCode } = useAsyncData<string | null>('__compodium-component-example-code', async () => {
  if (props.example) {
    return await fetch<string>(`/__compodium__/api/example/${props.example}`)
  }
  return null
}, { watch: [() => props.example] })

const code = computed(() => {
  if (!props.component) return

  return props.example && exampleCode.value
    ? updateComponentCode(props.component.pascalName, exampleCode.value, props.props, props.defaultProps)
    : generateComponentCode(props.component.pascalName, props.props, props.defaultProps)
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
  <div class="relative h-full text-wrap overflow-y-auto bg-(--ui-bg-elevated)/50">
    <!-- eslint-disable vue/no-v-html -->
    <pre
      class="p-4 text-sm rounded-lg"
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
