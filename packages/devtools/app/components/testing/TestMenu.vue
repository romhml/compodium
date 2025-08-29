<script setup lang="ts">
const { runTests, watchMode, testStatus, stopTests, testErrors } = useComponentTests()
import { onKeyStroke } from '@vueuse/core'

onKeyStroke(['Enter'], async (e) => {
  if (testStatus.value === 'running') return
  if (e.metaKey || e.ctrlKey) {
    await runTests()
  }
}, { dedupe: true, eventName: 'keydown' })

const open = ref(false)

watch(testStatus, () => {
  if (testStatus.value === 'failed') open.value = true
})
</script>

<template>
  <UCollapsible
    v-model:open="open"
    class="relative before:absolute before:inset-0 before:-m-0.5 before:rounded-md before:-z-1 after:absolute transition ease-in-out"
    :class="{
      'before:bg-gradient-to-br before:from-primary-300 before:via-primary-500 before:to-primary-800 before:animate-pulse': testStatus === 'running',
      'before:bg-error': testStatus === 'failed',
      'before:bg-success': testStatus === 'passed',
      'before:bg-accented': !testStatus || testStatus === 'interrupted'
    }"
  >
    <div class="flex justify-between items-center p-2">
      <span
        class="flex gap-2 items-center font-medium text-sm"
        :class="{
          'text-default': testStatus === 'running',
          'text-error': testStatus === 'failed',
          'text-success': testStatus === 'passed',
          'text-muted': !testStatus || testStatus === 'interrupted'
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
        <UPopover mode="hover">
          <UButton
            variant="ghost"
            size="sm"
            color="neutral"
            block
            :trailing-icon="watchMode ? 'lucide:eye' : 'lucide:eye-off' "
            @click.stop="watchMode = !watchMode"
          />
          <template #content>
            <p class="text-xs py-1 px-2">
              {{ watchMode ? 'Disable' : 'Enable' }} watch mode
            </p>
          </template>
        </UPopover>

        <UTooltip
          v-if="testStatus !== 'running'"
          text="Run tests"
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

        <UTooltip
          v-else
          text="Cancel tests"
        >
          <UButton
            variant="ghost"
            icon="lucide:pause"
            size="sm"
            color="neutral"
            trailing
            loading-auto
            @click.stop="stopTests()"
          />
        </UTooltip>

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
        <div v-if="testStatus === 'passed'">
          <div class="flex justify-between gap-2 mr-1.5">
            <p
              class="text-sm text-success"
            >
              Passed
            </p>
            <TestStatusIcon status="passed" />
          </div>

          <span class="text-sm">
            No visual changes
          </span>
        </div>

        <div v-else-if="testStatus === 'failed'">
          <div class="flex justify-between gap-2 mr-1.5">
            <p class="text-sm text-error mb-1">
              Failed
            </p>
            <TestStatusIcon status="failed" />
          </div>
          <p
            v-if="testErrors.length"
            class="flex justify-between w-full gap-2 text-sm"
          >
            {{ testErrors.length }} error{{ testErrors.length > 1 ? 's' : null }}
          </p>
        </div>

        <div
          v-else-if="testStatus === 'running'"
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
            Interrupted
          </p>
          <UIcon name="lucide:unplug" />
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
