<script setup lang="ts">
import type { Component } from '@compodium/core'
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

const { testResults, runTests, testStatus } = useCompodiumTests()
const componentTestResults = computed(() => props.component && testResults.value?.[props.component?.pascalName])

const lazyTestResults = ref(componentTestResults.value)
const testMeta = computed(() => lazyTestResults.value?.meta?.compodium)

const accepting = ref(false)
async function onAccept() {
  if (!props.component) return
  accepting.value = true

  try {
    await runTests(props.component.pascalName, true)
  } finally {
    accepting.value = false
  }
}

const loading = computed(() => testStatus.value === 'running' || accepting.value)

const { hooks } = useCompodiumClient()
hooks.hook('test:result', async (payload) => {
  if (!props.component?.pascalName || payload.meta?.compodium?.component !== props.component?.pascalName) return

  if (payload.result.state === 'passed' || payload.result.state === 'failed') {
    await refresh()
    lazyTestResults.value = componentTestResults.value
  }
})
</script>

<template>
  <div class="bg-default p-0.5 border-t border-default sticky top-0 z-1 gap-0.5">
    <div
      v-if="!lazyTestResults"
      class="text-dimmed text-center p-8"
    >
      <UIcon
        name="lucide:flask-conical-off"
        size="20"
      />

      <p class="mt-1">
        No test results available
      </p>

      <UButton
        variant="subtle"
        icon="lucide:circle-play"
        trailing
        class="mt-3"
        loading-auto
        :disabled="loading"
        @click="runTests(component?.pascalName)"
      >
        Run tests
      </UButton>
    </div>
    <div
      v-else-if="lazyTestResults.ok"
      class="p-2 flex justify-between items-center"
    >
      <div
        class="flex gap-2 items-center"
      >
        <p class="font-semibold text-sm text-muted">
          No changes
        </p>
        <TestStatusIcon :status="componentTestResults?.result.state" />
      </div>
      <UButton
        variant="ghost"
        color="neutral"
        icon="lucide:refresh-ccw"
        trailing
        size="sm"
        loading-auto
        :disabled="loading"
        @click="runTests(component?.pascalName)"
      />
    </div>
    <div
      v-else-if="testMeta?.diff"
      class="p-2 flex justify-between items-center"
    >
      <div
        class="flex gap-2 items-center"
      >
        <p class="font-semibold text-sm text-muted">
          Changes found
        </p>
        <TestStatusIcon :status="componentTestResults?.result.state" />
      </div>

      <div class="flex gap-2">
        <UButton
          variant="subtle"
          size="sm"
          icon="lucide:check"
          trailing
          loading-auto
          :disabled="loading"
          @click="onAccept()"
        >
          Accept
        </UButton>

        <UButton
          variant="ghost"
          color="neutral"
          icon="lucide:refresh-ccw"
          trailing
          size="sm"
          loading-auto
          :disabled="loading"
          @click="runTests(component?.pascalName)"
        />
      </div>
    </div>
    <div
      v-else
      class="p-2 flex flex-col gap-2"
    >
      <div
        class="flex justify-between items-center"
      >
        <div class="flex gap-2 items-center">
          <p class="font-semibold text-sm text-muted">
            Unexpected error
          </p>
        </div>

        <UButton
          variant="ghost"
          color="neutral"
          icon="lucide:refresh-ccw"
          trailing
          size="sm"
          loading-auto
          :disabled="loading"
          @click="runTests(component?.pascalName)"
        />
      </div>

      <UAlert
        variant="subtle"
        class="w-full"
        color="error"
        :description="lazyTestResults.result.errors?.map(e => e.message).join('\n')"
      />
    </div>

    <div
      v-if="status !== 'pending' && lazyTestResults"
      class="p-2 flex flex-col gap-4"
    >
      <ImageComparisonSlider
        v-if="testMeta?.diff && screenshot?.current && screenshot?.staged"
        :src="screenshot.current"
        :expected="screenshot.staged"
      />
      <img
        v-if="testMeta?.diff && screenshot?.diff"
        :src="screenshot.diff"
        class="object-scale-down select-none w-full rounded bg-elevated border border-muted px-8 py-10"
      >
      <img
        v-else-if="screenshot?.current"
        :src="screenshot.current"
        class="object-scale-down select-none w-full rounded bg-elevated border border-muted px-8 py-10"
      >
    </div>
  </div>
</template>
