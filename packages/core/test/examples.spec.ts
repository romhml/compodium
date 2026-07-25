import { describe, expect, it } from 'vitest'
import { transformExampleCode } from '../src/plugins/examples'

describe('transformExampleCode', () => {
  it('removes metadata calls with nested expressions without touching strings or comments', async () => {
    const source = `<script setup lang="ts">
const label = 'extendCompodiumMeta({ keep: true })'
// extendCompodiumMeta({ keep: true })
extendCompodiumMeta({ defaults: makeDefaults({ nested: true }) })
</script>
<template><div>{{ label }}</div></template>`

    const result = await transformExampleCode('Example.vue', source)

    expect(result).toContain(`const label = 'extendCompodiumMeta({ keep: true })'`)
    expect(result).toContain('// extendCompodiumMeta({ keep: true })')
    expect(result).not.toContain('defaults: makeDefaults')
    expect(result).toContain('<script setup lang="ts">')
  })

  it('removes script blocks made empty by metadata cleanup', async () => {
    const source = `<template><Example /></template>
<script setup lang="ts">
extendCompodiumMeta({ defaults: { count: 1 } })
</script>
`

    await expect(transformExampleCode('Example.vue', source)).resolves.toBe(`<template><Example /></template>

`)
  })

  it('uses the parsed content boundary when script attributes contain tag-like text', async () => {
    const source = `<template><Example /></template>
<script setup lang="ts" data-label="<script">
extendCompodiumMeta({ defaults: true })
</script>`

    await expect(transformExampleCode('Example.vue', source)).resolves.toBe('<template><Example /></template>\n')
  })

  it('removes Vue imports structurally for Nuxt examples', async () => {
    const source = `<script setup lang="ts">
import {
  computed,
  ref
} from "vue"
import { helper } from './helper'
const value = computed(() => helper(ref(1)))
</script>`

    const result = await transformExampleCode('Example.vue', source, true)

    expect(result).not.toContain('from "vue"')
    expect(result).toContain(`import { helper } from './helper'`)
    expect(result).toContain('const value = computed')
  })
})
