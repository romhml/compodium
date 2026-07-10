import { dirname } from 'pathe'
import { fileURLToPath } from 'node:url'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import type { Component, ComponentCollection, CompodiumMeta, PropertyMeta } from '@compodium/core'
import { describe, expect, it } from 'vitest'
import { joinURL } from 'ufo'

type NuxtUiCollectionComponent = Component & {
  componentName?: string
  componentPath?: string
}

const NUXT_UI_BUTTON_COLORS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral'
]

describe('nuxt playground', async () => {
  const rootDir = fileURLToPath(joinURL(dirname(import.meta.url), '../../../playgrounds/nuxt'))

  await setup({
    rootDir,
    dev: true
  })

  describe('Nuxt UI component metadata', () => {
    it('resolves UButton color prop literals from node_modules', async () => {
      const button = await fetchNuxtUiButton()
      const buttonSourcePath = getComponentSourcePath(button)

      expect(buttonSourcePath).toContain('@nuxt/ui')
      expect(buttonSourcePath).not.toContain('/playgrounds/nuxt/app/components/')

      const meta = await $fetch<CompodiumMeta>('/__compodium__/api/meta', {
        query: {
          component: buttonSourcePath
        }
      })

      const colorProp = findRequiredProp(meta.props, 'color')
      const colorLiterals = collectStringLiterals(colorProp.schema)

      expect(colorProp.required).toBe(false)
      expect(colorLiterals).toEqual(expect.arrayContaining(NUXT_UI_BUTTON_COLORS))
    })
  })
})

async function fetchNuxtUiButton(): Promise<NuxtUiCollectionComponent> {
  const collections = await $fetch<ComponentCollection[]>('/__compodium__/api/collections')
  const nuxtUiCollection = collections.find(collection => collection.name === 'Nuxt UI')

  if (!nuxtUiCollection) {
    throw new Error('Expected Compodium collections to include Nuxt UI')
  }

  const components = nuxtUiCollection.components as NuxtUiCollectionComponent[]
  const button = components.find(component => component.pascalName === 'UButton' || component.componentName === 'UButton')

  if (!button) {
    const componentNames = components.map(component => component.componentName ?? component.pascalName).join(', ')
    throw new Error(`Expected Nuxt UI collection to include UButton. Found: ${componentNames}`)
  }

  return button
}

function getComponentSourcePath(component: NuxtUiCollectionComponent): string {
  const sourcePath = [component.filePath, component.realPath, component.componentPath].find(path => path?.includes('@nuxt/ui'))

  if (!sourcePath) {
    throw new Error('Expected UButton to resolve to a Nuxt UI component path')
  }

  return sourcePath
}

function findRequiredProp(props: PropertyMeta[], propName: string): PropertyMeta {
  const prop = props.find(prop => prop.name === propName)

  if (!prop) {
    throw new Error(`Expected component metadata to include ${propName} prop`)
  }

  return prop
}

function collectStringLiterals(value: unknown): string[] {
  const literals = new Set<string>()
  collectStringLiteralsInto(value, literals)
  return [...literals]
}

function collectStringLiteralsInto(value: unknown, literals: Set<string>) {
  if (!value) {
    return
  }

  if (typeof value === 'string') {
    collectLiteralString(value, literals)
    return
  }

  if (Array.isArray(value)) {
    value.forEach(item => collectStringLiteralsInto(item, literals))
    return
  }

  if (typeof value !== 'object') {
    return
  }

  Object.values(value).forEach(item => collectStringLiteralsInto(item, literals))
}

function collectLiteralString(value: string, literals: Set<string>) {
  const quotedLiterals = [...value.matchAll(/["']([^"']+)["']/g)].map(match => match[1])

  if (quotedLiterals.length > 0) {
    quotedLiterals.forEach((literal) => {
      if (literal) {
        literals.add(literal)
      }
    })
    return
  }

  if (/^[a-z][a-z0-9-]*$/.test(value)) {
    literals.add(value)
  }
}
