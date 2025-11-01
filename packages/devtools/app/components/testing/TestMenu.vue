<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'

const { runTests, testStatus, testErrors } = useVitest()

onKeyStroke(['Enter'], async (e) => {
  if (testStatus.value === 'run') return
  if (e.metaKey || e.ctrlKey) {
    await runTests()
  }
}, { dedupe: true, eventName: 'keydown' })

const open = ref(false)

watch(testStatus, () => {
  if (testStatus.value === 'fail') open.value = true
})
</script>

<template>
  <UCollapsible
    v-model:open="open"
    class="relative before:absolute before:inset-0 before:-m-0.5 before:rounded-md before:-z-1 after:absolute transition ease-in-out"
    :class="{
      'before:bg-gradient-to-br before:from-primary-300 before:via-primary-500 before:to-primary-800 before:animate-pulse': testStatus === 'run',
      'before:bg-error': testStatus === 'fail',
      'before:bg-success': testStatus === 'pass'
    }"
  >
    <div class="flex justify-between items-center p-2">
      <span
        class="flex gap-2 items-center font-medium text-sm"
        :class="{
          'text-default': testStatus === 'run',
          'text-error': testStatus === 'fail',
          'text-success': testStatus === 'pass'
        }"
      >
        <UIcon
          name="lucide:flask-conical"
          size="16"
        />
        <p>
          Tests
        </p>
      </span>

      <div class="flex">
        <UTooltip
          text="Run tests"
          :loading="testStatus === 'run'"
          :kbds="['meta', 'Enter']"
        >
          <UButton
            variant="ghost"
            icon="lucide:circle-play"
            size="sm"
            color="neutral"
            trailing
            loading-auto
            @click.stop="runTests()"
          />
        </UToolTip>

        <UButton
          variant="ghost"
          icon="lucide:chevron-down"
          size="sm"
          color="neutral"
          trailing
          loading-auto
          :data-open="open"
          class="group"
          :ui="{
            trailingIcon: 'group-data-[open=true]:rotate-180 transition-transform duration-200'
          }"
          @click.stop="open = !open"
        />
      </div>
    </div>

    <template #content>
      <div class="p-2 min-h-16 w-full border-t border-muted">
        <div v-if="testStatus === 'pass'">
          <div class="flex justify-between gap-2 mr-1.5">
            <p
              class="text-sm text-success"
            >
              Passed
            </p>
            <TestStatusIcon status="pass" />
          </div>

          <span class="text-sm">
            No errors
          </span>
        </div>

        <div v-else-if="testStatus === 'fail'">
          <div class="flex justify-between gap-2 mr-1.5">
            <p class="text-sm text-error mb-1">
              Failed
            </p>
            <TestStatusIcon status="fail" />
          </div>
          <p
            v-if="testErrors.length"
            class="flex justify-between w-full gap-2 text-sm"
          >
            {{ testErrors.length }} error{{ testErrors.length > 1 ? 's' : null }}
          </p>
        </div>

        <div
          v-else-if="testStatus === 'run'"
          class="flex flex-col gap-2 justify-center items-center text-sm text-muted"
        >
          <p> Running... </p>
          <UIcon
            name="lucide:loader"
            class="animate-spin"
          />
        </div>
        <div
          v-else
          class="flex flex-col gap-2 justify-center items-center text-sm text-muted"
        >
          <p>
            No test results
          </p>
          <UIcon name="lucide:flask-conical-off" />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
