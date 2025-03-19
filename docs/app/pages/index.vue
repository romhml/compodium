<script setup lang="ts">
const { data: page } = await useAsyncData('index', () => queryCollection('landing').path('/').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({
  title: page.value.seo.title,
  titleTemplate: null,
  ogTitle: page.value.seo.title,
  description: page.value.seo.description,
  ogDescription: page.value.seo.description,
  ogImage: 'https://docs-template.nuxt.dev/social-card.png',
  twitterImage: 'https://docs-template.nuxt.dev/social-card.png'
})

const features = [
  {
    title: 'No Stories Required',
    description: 'Analyzes your component code directly, eliminating the need to write stories.',
    icon: 'i-lucide-book-lock'
  },
  {
    title: 'Fast',
    description: 'Built on top of Vite for rapid development and instant feedback, enhancing productivity.',
    icon: 'i-lucide-zap'
  },
  {
    title: 'DevTools Integration',
    description: 'Integrates with Vue and Nuxt devtools for a cohesive development experience.',
    icon: 'i-lucide-terminal'
  },
  {
    title: 'Effortless Setup',
    description: 'Simple setup process and minimal maintenance, allowing you to focus on building components.',
    icon: 'i-lucide-cog'
  },
  {
    title: 'Code generation',
    description: 'Generates up-to-date template code based on component props, ready to copy and use instantly.',
    icon: 'i-lucide-code'
  },
  {
    title: 'UI Library Integrations',
    description: 'Integrates with popular UI libraries, showcasing examples for locally installed components.',
    icon: 'i-lucide-plug'
  }
]
</script>

<template>
  <div class="py-20">
    <UPageSection
      title="Build Vue components faster."
      description="Compodium streamlines Vue and Nuxt component development with direct code analysis, devtools integration, and effortless setup."
      orientation="vertical"
      :links="[
        { label: 'Get started', to: '/getting-started', trailingIcon: 'i-lucide-arrow-right', size: 'lg', color: 'neutral' }
      ]"
      :ui="{ container: 'relative', description: 'max-w-5xl mx-auto' }"
    />
    <UPageSection
      :features="features"
      class="pb-20"
    />
    <ClientOnly>
      <HeroBg class="absolute -z-1 inset-x-0 inset-y-20 md:inset-y-0" />
    </ClientOnly>
  </div>
</template>
