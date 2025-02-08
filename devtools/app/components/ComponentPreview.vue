<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { kebabCase } from 'scule'
import { escapeString } from 'knitwork'
import type { Component } from '../../../src/types'

const props = defineProps<{ component?: Component, props?: Record<string, any> }>()

function genPropValue(value: any): string {
  if (typeof value === 'string') {
    return `'${escapeString(value).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}'`
  }
  if (Array.isArray(value)) {
    return `[ ${value.map(item => `${genPropValue(item)}`).join(',')} ]`
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).map(([key, val]) => `${key}: ${genPropValue(val)}`)
    return `{ ${entries.join(`,`)} }`
  }

  return value
}

const code = computed(() => {
  if (!props.component) return

  const propsTemplate = Object.entries(props.props ?? {})?.map(([key, value]: [string, any]) => {
    const defaultValue: any = props.component?.meta?.props.find((prop: any) => prop.name === key)?.default
    if (defaultValue === value) return
    if (value === true) return kebabCase(key)
    if (value === false && defaultValue === true) return `:${kebabCase(key)}="false"`
    if (!value) return
    if (typeof value === 'string') return `${kebabCase(key)}=${genPropValue(value)}`
    return `:${kebabCase(key)}="${genPropValue(value)}"`
  }).filter(Boolean).join('\n')

  const extraTemplate = [
    propsTemplate,
  ].filter(Boolean).join(' ')

  return `<${props.component.pascalName} ${extraTemplate} />`
})

const { $prettier } = useNuxtApp()
const { data: formattedCode } = useAsyncData('__compodium-component-formatted-code', async () => {
  if (!code.value) return
  return await $prettier.format(code.value, {
    semi: false,
    singleQuote: true,
    printWidth: 80,
  })
}, { watch: [code] })

const { codeToHtml } = useShiki()
const { data: highlightedCode } = useAsyncData('__compodium-component-highlighted-code', async () => {
  return formattedCode.value
    ? codeToHtml(formattedCode.value, 'vue')
    : undefined
}, { watch: [formattedCode] })

const { copy, copied } = useClipboard()

const previewUrl = computed(() => {
  if (!props.component) return
  const baseUrl = `/__compodium__/renderer`
  const params = new URLSearchParams({
    path: props.component.filePath,
  })
  return `${baseUrl}?${params.toString()}`
})
</script>

<template>
  <div class="flex flex-col bg-grid">
    <iframe
      v-if="component"
      class="grow w-full"
      :src="previewUrl"
    />
    <div
      v-if="highlightedCode && formattedCode"
      class="relative w-full p-3"
    >
      <!-- eslint-disable vue/no-v-html -->
      <pre
        class="p-4 min-h-40 max-h-72 text-sm overflow-y-auto rounded-lg border border-[var(--ui-border)] bg-neutral-50 dark:bg-neutral-800"
        v-html="highlightedCode"
      />
      <UButton
        color="neutral"
        size="sm"
        variant="link"
        :icon="copied ? 'i-lucide-clipboard-check' : 'i-lucide-clipboard'"
        class="absolute top-6 right-6"
        @click="copy(formattedCode)"
      />
    </div>
  </div>
</template>

<style scoped>
.bg-grid {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='%23fff'/%3E%3Cpath fill='none' stroke='hsla(0, 0%25, 98%25, 1)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
  background-size: 40px 40px;
}

.dark .bg-grid {
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' transform='scale(3)'%3E%3Crect width='100%25' height='100%25' fill='hsl(0, 0%25, 8.5%25)'/%3E%3Cpath fill='none' stroke='hsl(0, 0%25, 11.0%25)' stroke-width='.2' d='M10 0v20ZM0 10h20Z'/%3E%3C/svg%3E");
  background-size: 40px 40px;
}
</style>
