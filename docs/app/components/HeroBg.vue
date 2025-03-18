<template>
  <div class="pointer-events-none overflow-hidden">
    <div class="w-full h-full">
      <svg :viewBox="`0 0 ${width} ${height}`">
        <circle
          v-for="dot in dots"
          :key="dot.id"
          class="dot"
          :cx="dot.x"
          :cy="dot.y"
          :r="dot.radius"
          :style="{ '--delay': `${dot.delay}s`, '--startX': `${dot.x}px`, '--startY': `${dot.y}px` }"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

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
  dotCount: 800,
  width: 1000,
  height: 1000
})

const dots = ref<Dot[]>([])

const breakpoints = useBreakpoints(breakpointsTailwind)

const generateDots = (count: number) => {
  const dotsArray = Array.from({ length: count }, () => {
    const angle = Math.random() * 2 * Math.PI
    const distance = Math.random() * Math.max(props.width, props.height)
    const radius = Math.random() * (breakpoints.isGreater('md') ? 1 : 3)
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
  animation: moveIn 3s infinite ease-out;
  animation-delay: var(--delay);
  opacity: 0;
  filter: blur(0.5px);
}

@keyframes moveIn {
  0% {
    transform: translate(calc(var(--startX) - 50%), calc(var(--startY) - 20%));
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 0;
  }
  100% {
    transform: translate(calc(50% - var(--startX)), calc(20% - var(--startY)));
  }
}
</style>
