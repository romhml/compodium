<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { kebabCase } from 'scule'
import { escapeString } from 'knitwork'
import type { Component, ComponentExample } from '../../../src'

const props = defineProps<{ example?: string, component?: Component | ComponentExample, props?: Record<string, any> }>()

const componentProps = computed(() => new Set(props.component?.meta?.props.map((prop: any) => prop.name)))

const fetch = $fetch.create({ baseURL: '/__compodium__/api' })
const { data: exampleCode } = useAsyncData<string | null>('__compodium-component-example-code', async () => {
  if (props.example) {
    return await fetch(`/__compodium__/api/example/${props.example}`)
  }
  return null
}, { watch: [() => props.example] })

function genPropValue(value: any): string {
  if (typeof value === 'string') {
    return `'${escapeString(value).replace(/'/g, '&apos;').replace(/"/g, '&quot;')}'`
  }
  if (value instanceof Date) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')

    const dateString = `${year}-${month}-${day}`
    return `new Date('${dateString}')`
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
    if (!componentProps.value.has(key)) return

    const defaultValue: any = props.component?.meta?.props.find((prop: any) => prop.name === key)?.default

    if (defaultValue === value) return
    if (value === true) return kebabCase(key)
    if (value === false && defaultValue === true) return `:${kebabCase(key)}="false"`
    if (!value) return
    if (typeof value === 'string') return `${kebabCase(key)}=${genPropValue(value)}`
    return `:${kebabCase(key)}="${genPropValue(value)}"`
  }).filter(Boolean).join('\n')

  const extraTemplate = [
    propsTemplate
  ].filter(Boolean).join(' ')

  if (props.example && exampleCode.value) {
    const componentRegexp = new RegExp(`<${props.component.pascalName}(\\s|\\r|>)`)
    return exampleCode.value.replace(/import .* from ['"]#.*['"];?\n+/, '')
      .replace(componentRegexp, `<${props.component.pascalName} ${extraTemplate}$1`)
      .replace('v-bind="$attrs"', '')
  }

  return `<${props.component.pascalName} ${extraTemplate} />`
})

const { $prettier } = useNuxtApp()
const { data: formattedCode } = useAsyncData('__compodium-component-formatted-code', async () => {
  if (!code.value) return
  return await $prettier.format(code.value, {
    semi: false,
    singleQuote: true,
    printWidth: 80
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
  <div class="relative w-full p-3">
    <!-- eslint-disable vue/no-v-html -->
    <pre
      class="p-4 min-h-40 max-h-72 text-sm overflow-y-auto rounded-lg border border-[var(--ui-border)] bg-(--ui-bg-muted)"
      v-html="highlightedCode"
    />
    <UButton
      color="neutral"
      size="sm"
      variant="link"
      :icon="copied ? 'i-lucide-clipboard-check' : 'i-lucide-clipboard'"
      class="absolute top-6 right-6"
      @click="copy(formattedCode ?? '')"
    />
  </div>
</template>
