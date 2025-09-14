<script setup lang="ts">
const _props = withDefaults(defineProps<{
  title?: string
  shakeIt?: boolean
  spinIt?: boolean
  bounceIt?: boolean
}>(), { title: 'Welcome!' })

extendCompodiumMeta<typeof _props>({
  defaultProps: {
    bounceIt: true
  }
})

function openDevtools() {
  // @ts-expect-error this is auto imported
  const client = useNuxtDevTools()
  client?.value?.devtools.navigate('/modules/custom-compodium')
}
</script>

<template>
  <div
    class="data-[spin=true]:animate-spin data-[bounce=true]:animate-bounce"
    :data-spin="spinIt"
    :data-bounce="bounceIt"
    :class="{ shake: shakeIt }"
  >
    <div
      class="border border-default p-4 rounded-lg w-sm"
    >
      <p class="text-center font-bold mb-4">
        {{ title }}
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
        @click="openDevtools()"
      >
        Open in Nuxt Devtools
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.shake {
  animation: shake 0.5s ease-in-out infinite
}

@keyframes shake {
  0%, 100%  {
    transform: rotate(-3deg);
  }
  50% {
    transform: rotate(3deg);
  }
}
</style>
