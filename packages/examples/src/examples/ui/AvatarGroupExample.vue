<script setup lang="ts">
import UAvatar from '@nuxt/ui/runtime/components/Avatar.vue'
import UAvatarGroup from '@nuxt/ui/runtime/components/AvatarGroup.vue'
</script>

<template>
  <UAvatarGroup>
    <UAvatar
      src="https://github.com/benjamincanac.png"
      alt="Benjamin Canac"
    />
    <UAvatar
      src="https://github.com/romhml.png"
      alt="Romain Hamel"
    />
    <UAvatar
      src="https://github.com/noook.png"
      alt="Neil Richter"
    />
  </UAvatarGroup>
</template>
