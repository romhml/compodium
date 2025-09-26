<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    title: 'Introducing Nuxt Icon v1',
    description: 'Discover Nuxt Icon v1 - a modern, versatile, and customizable icon solution for your Nuxt projects.',
    date: '2024-11-25',
    image: 'https://nuxt.com/assets/blog/nuxt-icon/cover.png',
    authors: [
      {
        name: 'Anthony Fu',
        description: 'antfu7',
        avatar: {
          src: 'https://github.com/antfu.png'
        },
        to: 'https://github.com/antfu',
        target: '_blank'
      }
    ]
  }
})
</script>

<template>
  <UBlogPost />
</template>
