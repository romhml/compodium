<script setup lang="ts">
// @ts-expect-error this is auto imported
const devtoolsClient = useNuxtDevTools()

defineProps<{
  shakeIt?: boolean
  spinIt?: boolean
  bounceIt?: boolean
}>()

extendCompodiumMeta({ defaultProps: { bounceIt: true } })
</script>

<template>
  <div
    class="h-screen w-screen flex flex-col justify-center items-center data-[spin=true]:animate-spin data-[bounce=true]:animate-bounce"
    :data-spin="spinIt"
    :data-bounce="bounceIt"
    :class="{ shaker: shakeIt }"
  >
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

<style scoped>
/*!
 * Woah.css - http://joerezendes.com/woah.css
 * Version - 1.0
 * Licensed under the MIT license - http://opensource.org/licenses/MIT
 *
 * Github - https://github.com/joerez/Woah.css
 *
 * Copyright (c) 2018 Joe Rezendes
 */

/**
 * shaker
 * - Increases and decreases in size
 */
@keyframes shaker {
  from {
    transform: translate3d(0,0,0);
  }

  33% {
    transform: translate3d(-20px,10px,0);
  }

  66% {
    transform: translate3d(20px,0px,0);
  }

  to {
    transform: translate3d(0,0,0);
  }
}

.shaker {
  animation-timing-function: linear;
  transform-origin: bottom center;
  animation-name: shaker;
  animation-duration: .1s;
  animation-iteration-count: infinite;
}

/**
  * flyOut
  * - Flies out
  */
  @keyframes flyOut {

    1% {
      transform: translate3d(0,0,0) scale(1);
    }

    20% {
      transform: translate3d(0,100px,400px) rotateX(90deg);
    }
    30% {
      transform: translate3d(300px,0px,100px) rotateX(95deg);
    }
    40% {
      transform: translate3d(-600px,-200px,0px) rotateX(80deg);
    }
    60% {
      transform: translate3d(2000px,-2000px,0px) rotateX(0deg);
    }
    70% {
      transform: translate3d(-2000px, 2000px, 0px) rotateX(60deg) scale(5);
    }
    80% {
      transform: translate3d(0,4000px,0px);
    }
    85% {
      transform: translate3d(-0px,-0px,0px) scale(.07);
    }
    100% {
      transform: translate3d(2000px,-2000px,0px);
      display: none;
    }
}
</style>
