<script setup lang="ts">
const { runTests, watchMode } = useCompodiumTests()

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

        <UButton
          variant="ghost"
          icon="lucide:circle-play"
          size="sm"
          color="neutral"
          trailing
          loading-auto
          @click.stop="runTests()"
        />

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
        <div>
          TODO: Display tests results here
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
