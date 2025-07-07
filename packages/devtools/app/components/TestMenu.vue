<script setup lang="ts">
const { runTests, watchMode, testStatus, testStats } = useCompodiumTests()
import { onKeyStroke } from '@vueuse/core'

onKeyStroke(['Enter'], async (e) => {
  if (testStatus.value === 'running') return
  if (e.metaKey || e.ctrlKey) {
    await runTests()
  }
}, { dedupe: true, eventName: 'keydown' })

const open = ref(false)
</script>

<template>
  <UCollapsible
    v-model:open="open"
    class=""
  >
    <div
      class="flex justify-between items-center p-2"
      @click.prevent=""
    >
      <span class="flex gap-2 items-center text-muted font-medium text-sm">
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
            variant="link"
            :color="watchMode ? 'primary' : 'neutral'"
            size="sm"
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
      <div class="p-1 border-t border-muted">
        <div v-if="testStatus === 'passed'">
          <p class="text-sm font-muted">
            Tests passed in {{ testStats?.took }}ms
          </p>
        </div>
        <div v-else-if="testStatus === 'failed'">
          <div class="flex justify-between items-center gap-2">
            <p class="text-sm font-muted">
              Tests failed
            </p>
            <UButton
              size="xs"
              variant="ghost"
              icon="lucide:check"
            >
              Accept changes
            </UButton>
          </div>
        </div>
        <div v-else-if="testStatus === 'running'">
          <p class="text-sm font-muted">
            Running...
          </p>
        </div>
        <div v-else>
          <p class="text-sm font-muted">
            No results available...
          </p>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
