<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    title: 'Login',
    description: 'Enter your credentials to access your account.',
    icon: 'i-lucide-user',
    fields: [
      {
        name: 'email',
        type: 'text',
        label: 'Email',
        placeholder: 'Enter your email',
        required: true
      },
      {
        name: 'password',
        type: 'password',
        label: 'Password',
        placeholder: 'Enter your password',
        required: true
      }
    ]
  }
})
</script>

<template>
  <UAuthForm class="max-w-md" />
</template>
