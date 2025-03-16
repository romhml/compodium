<script setup lang="ts">
import UPagination from '@nuxt/ui/runtime/components/Pagination.vue'

extendCompodiumMeta({
  defaultProps: {
    total: 50
  }
})
</script>

<template>
  <UPagination />
</template>
