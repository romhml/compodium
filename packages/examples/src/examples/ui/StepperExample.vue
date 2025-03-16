<script setup lang="ts">
import UStepper from '@nuxt/ui/runtime/components/Stepper.vue'
import UButton from '@nuxt/ui/runtime/components/Button.vue'
import { ref } from 'vue'

const items = [
  {
    slot: 'address',
    title: 'Address',
    description: 'Add your address here',
    icon: 'i-lucide-house'
  }, {
    slot: 'shipping',
    title: 'Shipping',
    description: 'Set your preferred shipping method',
    icon: 'i-lucide-truck'
  }, {
    slot: 'checkout',
    title: 'Checkout',
    description: 'Confirm your order'
  }
]

const stepper = ref()
</script>

<template>
  <UStepper
    ref="stepper"
    :items="items"
  >
    <template #content="{ item }">
      <div class="size-full min-h-60 min-w-60 flex items-center justify-center">
        {{ item.title }}
      </div>
      <div class="flex gap-2 justify-between mt-2">
        <UButton
          variant="outline"
          leading-icon="i-lucide-arrow-left"
          @click="stepper.previous()"
        >
          Back
        </UButton>
        <UButton
          trailing-icon="i-lucide-arrow-right"
          @click="stepper.next()"
        >
          Next
        </UButton>
      </div>
    </template>
  </UStepper>
</template>
