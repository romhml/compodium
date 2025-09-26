<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    title: 'Pro Plan',
    description: 'Perfect for growing teams',
    price: '$29',
    cycle: '/month',
    highlight: true,
    features: [
      'Up to 10 team members',
      'Advanced analytics',
      'Priority support',
      'Custom integrations'
    ],
    button: {
      label: 'Get Started'
    }
  }
})
</script>

<template>
  <UPricingPlan />
</template>
