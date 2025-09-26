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

function goToCompodium() {
  window.location.href = '/__compodium__/devtools'
}
</script>

<template>
  <div
    class="data-[spin=true]:animate-spin data-[bounce=true]:animate-bounce"
    :data-spin="spinIt"
    :data-bounce="bounceIt"
    :class="{ shaker: shakeIt }"
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
        data-testid="go-to-compodium"
        @click="goToCompodium()"
      >
        Go to Compodium
      </UButton>
      <USeparator label="or" />
      <UButton
        variant="ghost"
        color="success"
        icon="devicon-plain:vuejs"
        block
        :disabled="true"
        data-testid="open-devtools"
      >
        Open in Vue Devtools
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.shake {
  animation: shake 1s ease-in-out infinite
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
