<script setup lang="ts">
import type { Component, CompodiumTestResult } from '@compodium/core'
import resemble from 'resemblejs'

const props = defineProps<{
  component?: Component
}>()

const { data: screenshot, refresh, status } = await useAsyncData(
  computed(() => props.component ? `screenshot-${props.component?.pascalName}` : 'screenshot-empty'),
  async () => {
    if (!props.component) return

    const [currentBlob, stagedBlob] = await Promise.all([
      $fetch<Blob>(`/api/screenshot?component=${props.component.pascalName}`).catch((e) => {
        if (e.status === 404) return null
        throw e
      }),
      $fetch<Blob>(`/api/screenshot?component=./staged/${props.component.pascalName}`).catch((e) => {
        if (e.status === 404) return null
        throw e
      })
    ])

    const [current, staged] = [
      currentBlob && URL.createObjectURL(currentBlob),
      stagedBlob && URL.createObjectURL(stagedBlob)
    ]

    const diff: string | null = current && staged
      ? await new Promise(
          resolve =>
            resemble(staged)
              .compareTo(current)
              .onComplete((data) => {
                resolve(data.getImageDataUrl())
              })
        )
      : null

    return { staged, current, diff }
  }
)

async function runTests() {
  if (!props.component) return
  await $fetch(`/api/test?component=${props.component.pascalName}`)
  await refresh()
}

async function acceptChanges() {
  await $fetch(`/api/accept-changes?component=${props.component?.pascalName}`, { method: 'PUT' })
  await refresh()
}

const { hooks } = useCompodiumClient()
const result = ref<CompodiumTestResult | null>(null)

hooks.hook('test:result', async (payload) => {
  if (payload.name !== `'${props.component?.pascalName}'`) return
  result.value = payload
  await refresh()
})
</script>

<template>
  <div class="bg-default p-0.5 border-t border-default sticky top-0 z-1 gap-0.5">
    <div
      v-if="!result"
      class="p-2 flex justify-between items-center"
    >
      <UButton
        variant="outline"
        icon="lucide:arrow-right"
        trailing
        size="sm"
        block
        loading-auto
        @click="runTests()"
      >
        Run tests
      </UButton>
    </div>
    <div
      v-else-if="result.ok"
      class="p-2 flex justify-between items-center"
    >
      <div
        class="flex gap-2 items-center"
      >
        <p class="font-semibold text-sm text-muted">
          No changes
        </p>
        <div class="rounded-full border-2 border-success size-3 flex items-center justify-center">
          <UIcon
            name="lucide:check"
            stroke="2"
            class="text-success stroke-4"
          />
        </div>
      </div>
      <UButton
        variant="outline"
        icon="lucide:refresh-ccw"
        trailing
        size="sm"
        loading-auto
        @click="runTests()"
      />
    </div>
    <div
      v-else
      class="p-2 flex justify-between items-center"
    >
      <div
        class="flex gap-2 items-center"
      >
        <p class="font-semibold text-sm text-muted">
          Changes found
        </p>
        <div class="rounded-full border-2 border-error size-3 flex items-center justify-center">
          <UIcon
            name="lucide:minus"
            stroke="2"
            class="text-error stroke-2"
          />
        </div>
      </div>

      <div class="flex gap-2">
        <UButton
          size="sm"
          icon="lucide:check"
          trailing
          @click="acceptChanges()"
        >
          Accept
        </UButton>
        <UButton
          variant="outline"
          icon="lucide:refresh-ccw"
          trailing
          size="sm"
          loading-auto
          @click="runTests()"
        />
      </div>
    </div>
    <div
      v-if="status !== 'pending'"
      class="p-2"
    >
      <img
        v-if="screenshot?.diff"
        :src="screenshot.diff"
        class="object-scale-down w-full bg-elevated/50 border border-default rounded"
      >
      <img
        v-else-if="screenshot?.current || screenshot?.staged"
        :src="screenshot.current ?? screenshot.staged as string"
        class="object-scale-down w-full bg-elevated/50 border border-default rounded"
      >
    </div>
  </div>
</template>
