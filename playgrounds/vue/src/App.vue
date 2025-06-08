<script setup lang="ts">
import CompodiumWelcome from './components/CompodiumWelcome.vue'

import(/* @vite-ignore */ `/compodium:meta?component=${encodeURIComponent('/home/rohm/Contribs/compodium/playgrounds/vue/src/components/CompodiumWelcome.vue')}`)
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <CompodiumWelcome />
  </div>
</template>
