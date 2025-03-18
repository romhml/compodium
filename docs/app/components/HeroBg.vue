<template>
  <div class="pointer-events-none overflow-hidden">
    <div class="w-full h-full">
    <svg :viewBox="`0 0 ${width} ${height}`" >
      <circle
        v-for="dot in dots"
        :key="dot.id"
        class="dot"
        :cx="dot.x"
        :cy="dot.y"
        :r="dot.radius"
        :style="{ animationDelay: `${dot.delay}s` }"
      />
    </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Dot {
  x: number
  y: number
  id: string
  delay: number
  radius: number
}

const props = withDefaults(defineProps<{
  dotCount?: number
  width?: number
  height?: number
}>(), {
  dotCount: 500,
  width: 1000,
  height: 1000
})

const dots = ref<Dot[]>([])

const generateDots = (count: number) => {
  const dotsArray = Array.from({ length: count }, () => {
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * Math.min(props.width, props.height)
    const radius = Math.random() * 1.5
    const x = props.width / 2 + distance * Math.cos(angle)
    const y = props.height / 2 + distance * Math.sin(angle)
    const id = Math.random().toString(36).substring(2, 9)
    const delay = Math.random() * 4 // Random delay for staggered animation

    return { x, y, id, delay, radius }
  })
  dots.value = dotsArray
}

onMounted(() => {
  generateDots(props.dotCount)
})
</script>

<style scoped>
.dot {
  fill: var(--ui-text);
  animation: moveIn 4s infinite ease-out;
  opacity: 0;
  filter: drop-shadow(0 0 1px var(--ui-text)) drop-shadow(0 0 4px var(--ui-text-dimmed));
}
@keyframes moveIn {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  100% {
    transform: translate(45%, 10%) scale(0.1);
    opacity: 0;
  }
}
</style>
