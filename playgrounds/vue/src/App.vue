<script setup lang="ts">
import { addCustomTab } from '@vue/devtools-api'
import CompodiumWelcome from './components/CompodiumWelcome.vue'

addCustomTab({
  name: 'compodium',
  title: 'Compodium',
  // TODO: Icon
  view: {
    type: 'iframe',
    src: '/__compodium__/devtools'
  },
  category: 'modules'
})
</script>

<template>
  <div class="w-screen h-screen flex items-center justify-center">
    <CompodiumWelcome />
  </div>
</template>
