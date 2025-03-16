<script setup lang="ts">
import UCarousel from '@nuxt/ui/runtime/components/Carousel.vue'
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    class="w-xs h-xs"
    :items="[
      'https://picsum.photos/320/320?v=1',
      'https://picsum.photos/320/320?v=2',
      'https://picsum.photos/320/320?v=3'
    ]"
  >
    <img
      :src="item"
      class="rounded-lg"
    >
  </UCarousel>
</template>
