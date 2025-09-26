<script setup lang="ts">
import { ref } from 'vue'

extendCompodiumMeta({
  defaultProps: {
    locales: [
      { name: 'English', code: 'en', dir: 'ltr' },
      { name: 'Español', code: 'es', dir: 'ltr' },
      { name: 'Français', code: 'fr', dir: 'ltr' },
      { name: 'Deutsch', code: 'de', dir: 'ltr' }
    ]
  }
})

const modelValue = ref('en')
</script>

<template>
  <ULocaleSelect
    v-model="modelValue"
    class="w-40"
  />
</template>
