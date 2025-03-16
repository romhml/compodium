<script setup lang="ts">
import UTree from '@nuxt/ui/runtime/components/Tree.vue'

extendCompodiumMeta({
  defaultProps: {
    items: [
      {
        label: 'app',
        icon: 'i-lucide-folder',
        defaultExpanded: true,
        children: [{
          label: 'composables',
          icon: 'i-lucide-folder',
          defaultExpanded: true,
          children: [
            { label: 'useAuth.ts', icon: 'vscode-icons:file-type-typescript' },
            { label: 'useUser.ts', icon: 'vscode-icons:file-type-typescript' }
          ]
        },
        {
          label: 'components',
          icon: 'i-lucide-folder',
          children: [
            {
              label: 'Home',
              icon: 'i-lucide-folder',
              children: [
                { label: 'Card.vue', icon: 'vscode-icons:file-type-vue' },
                { label: 'Button.vue', icon: 'vscode-icons:file-type-vue' }
              ]
            }
          ]
        }]
      },
      { label: 'app.vue', icon: 'vscode-icons:file-type-vue' },
      { label: 'nuxt.config.ts', icon: 'vscode-icons:file-type-nuxt' }
    ]
  }
})
</script>

<template>
  <UTree />
</template>
