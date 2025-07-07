<template>
  <UCarousel
    v-slot="{ item }"
    class="w-xs h-xs"
    :items="[
      'https://picsum.photos/id/240/320/320',
      'https://picsum.photos/id/241/320/320',
      'https://picsum.photos/id/242/320/320'
    ]"
  >
    <img
      :src="item"
      class="rounded-lg"
    >
  </UCarousel>
</template>
