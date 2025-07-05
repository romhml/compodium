<script setup lang="ts">
import {
  motion,
  useDomRef,
  useMotionValue,
  useTransform
} from 'motion-v'
import { computed, onMounted, ref } from 'vue'

defineProps<{
  expected: string
  src: string
}>()

const containerRef = useDomRef()
const x = useMotionValue(0)
const boundary = ref(300)

// Make the input range reactive with computed to update when boundary changes
const inputRange = computed(() => [-boundary.value, boundary.value])

const clipPath = useTransform(x, inputRange as any, [
  'inset(0% 0% 0% 0%)',
  'inset(0% 0% 0% 100%)'
])

onMounted(() => {
  if (containerRef.value) {
    boundary.value = containerRef.value.clientWidth / 2
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative select-none"
  >
    <div class="relative bg-elevated border border-accented rounded overflow-hidden w-full block px-8 py-10">
      <motion.div>
        <div class="absolute top-2 left-2 bg-accented border-accented px-2 py-1 rounded pointer-events-none text-xs font-bold">
          Current
        </div>
        <img
          :src="src"
          class="w-full h-auto object-scale-down block"
        >
      </motion.div>
      <motion.div
        class="absolute inset-0 h-auto w-full bg-accented px-8 py-10"
        :style="{ clipPath }"
      >
        <div class="absolute top-2 right-2 bg-elevated border-muted px-2 py-1 rounded pointer-events-none text-xs font-bold">
          Expected
        </div>
        <img
          :src="expected"
          class="h-full w-full object-scale-down"
        >
      </motion.div>
    </div>
    <motion.div
      class="absolute border-primary top-0 bottom-0 border-l-1 cursor-grab left-1/2 -translate-x-1/2 drop-shadow focus-visible:outline-none"
      drag="x"
      :drag-elastic="0.00"
      :drag-constraints="containerRef"
      :style="{ x }"
      tabindex="0"
    >
      <div class="absolute top-5 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary text-inverted rounded-full flex items-center justify-center text-default cursor-grab touch-none focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 active:cursor-grabbing">
        <UIcon name="lucide:unfold-horizontal" />
      </div>
    </motion.div>
  </div>
</template>
