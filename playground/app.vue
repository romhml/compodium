<script setup lang="ts">
const devtoolsClient = useNuxtDevTools()
</script>

<template>
  <div class="h-screen w-screen flex flex-col justify-center items-center">
    <div
      class="border border-(--ui-border) p-4 rounded-lg w-sm"
    >
      <p class="text-center font-bold mb-4">
        Welcome!
      </p>

      <UButton
        variant="ghost"
        color="neutral"
        icon="lucide:rocket"
        block
        @click="navigateTo('/__compodium__/devtools', { external: true })"
      >
        Go to Compodium
      </UButton>
      <USeparator> or </USeparator>
      <UButton
        variant="ghost"
        color="success"
        icon="lineicons:nuxt"
        block
        :disabled="!devtoolsClient"
        @click="devtoolsClient?.devtools.navigate('/modules/custom-compodium')"
      >
        Open in devtools
      </UButton>
    </div>
  </div>
</template>
