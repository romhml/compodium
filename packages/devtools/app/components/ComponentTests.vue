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

const { testResults, acceptChanges, runTests, testsRunning } = useCompodiumTests()
const componentTestResults = computed(() => props.component && testResults.value?.[props.component?.pascalName])

const lazyTestResults = ref(componentTestResults.value)

const accepting = ref(false)
async function onAccept() {
  if (!props.component) return
  accepting.value = true

  try {
    await acceptChanges(props.component.pascalName)
    await runTests(props.component.pascalName)
  } finally {
    accepting.value = false
  }
}

const loading = computed(() => testsRunning.value || accepting.value)

watch(componentTestResults, async () => {
  if (!componentTestResults.value || componentTestResults.value?.result.state === 'pending') return
  await refresh()
  lazyTestResults.value = componentTestResults.value
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
        @click="runTests()"
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
        <UIcon
          name="rivet-icons:check-circle-solid"
          class="text-success size-3.5"
        />
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
      v-else
      class="p-2 flex justify-between items-center"
    >
      <div
        class="flex gap-2 items-center"
      >
        <p class="font-semibold text-sm text-muted">
          Changes found
        </p>
        <UIcon
          name="rivet-icons:minus-circle-solid"
          class="text-error size-3.5"
        />
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
      v-if="status !== 'pending' && lazyTestResults"
      class="p-2"
    >
      <ImageComparisonSlider
        v-if="screenshot?.current && screenshot?.staged"
        :src="screenshot.current"
        :expected="screenshot.staged"
      />
      <img
        v-if="screenshot?.diff"
        :src="screenshot.diff"
        class="object-scale-down w-full bg-accented/50 border border-accented rounded mt-4"
      >
    </div>
  </div>
</template>
