<script setup lang="ts">
import type { CompodiumTestResult } from '@compodium/testing'

defineProps<CompodiumTestResult>()
</script>

<template>
  <UCollapsible
    class="border-b border-default"
    :default-open="!ok"
  >
    <template #default="{ open }">
      <div class="flex justify-between gap-2 p-2">
        <div class="flex gap-2 items-center font-mono text-sm cursor-pointer">
          <TestStatusIcon
            :status="result.state"
            class="flex-none"
          />
          <p class="font-semibold text-muted truncate text-ellipsis text-wrap">
            {{ name }}
          </p>
        </div>
        <div class="flex items-center">
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
          :description="error.message"
        >
          {{ error.message }}
        </UAlert>

        <ImageComparisonSlider
          v-if="meta?.compodium?.diff"
          :src="'/@fs' + meta.compodium.screenshotPath!"
          :expected="'/@fs' + meta.compodium.stagedScreenshotPath!"
        />
        <img
          v-else-if="meta?.compodium?.screenshotPath"
          :src="'/@fs' + meta?.compodium?.screenshotPath"
          class="object-scale-down select-none w-full rounded bg-elevated border border-default px-8 py-10"
        >
      </div>
    </template>
  </UCollapsible>
</template>
