<script setup lang="ts">
import type { CompodiumTestResult } from '@compodium/testing'

const props = defineProps<CompodiumTestResult>()
const hasResults = computed(() => props.result?.errors?.length || props.meta?.compodium?.screenshotPath)

function formatErrorMessage(message: string) {
  return message.replace(/Reference screenshot:[\s\S]*/, '').replace(/<body>[\s\S]*/, '')
}
</script>

<template>
  <UCollapsible
    class="border-b border-default"
    :disabled="!hasResults"
    :default-open="!ok"
  >
    <template #default="{ open }">
      <div class="flex justify-between gap-2 p-2">
        <div class="flex gap-2 items-center font-mono text-sm">
          <TestStatusIcon
            :status="result.state"
            class="flex-none"
          />
          <p class="font-semibold text-muted truncate text-ellipsis text-wrap">
            {{ name }}
          </p>
        </div>
        <div class="flex items-center gap-1">
          <p
            v-if="diagnostic?.duration"
            class="text-xs"
            :class="{
              'text-muted': !diagnostic?.slow,
              'text-warning': diagnostic?.slow
            }"
          >
            {{ Math.round(diagnostic?.duration) }}ms
          </p>

          <UButton
            v-if="hasResults"
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
          />
          <span
            v-else
            class="size-7"
          />
        </div>
      </div>
    </template>
    <template #content>
      <div
        v-if="result.state !== 'pending'"
        class="flex flex-col gap-2 p-2"
      >
        <UAlert
          v-for="error in result.errors"
          :key="error.message"
          color="error"
          variant="subtle"
          :description="formatErrorMessage(error.message)"
        />

        <ImageComparisonSlider
          v-if="meta?.compodium?.diff && meta?.compodium?.screenshotPath"
          :src="'/@fs' + meta.compodium.stagedScreenshotPath!"
          :expected="'/@fs' + meta.compodium.screenshotPath!"
        />

        <img
          v-else-if="meta?.compodium?.screenshotPath || meta?.compodium?.stagedScreenshotPath!"
          :src="'/@fs' + (meta?.compodium?.screenshotPath ?? meta?.compodium?.stagedScreenshotPath)"
          class="object-scale-down select-none w-full rounded bg-elevated border border-default px-8 py-10"
        >
      </div>
    </template>
  </UCollapsible>
</template>
