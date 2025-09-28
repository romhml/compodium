<script setup lang="ts">
extendCompodiumMeta({
  defaultProps: {
    tiers: [
      {
        id: 'solo',
        title: 'Solo',
        price: '$249',
        description: 'For indie hackers.',
        billingCycle: '/month',
        button: {
          label: 'Buy now',
          variant: 'subtle'
        }
      },
      {
        id: 'team',
        title: 'Team',
        price: '$499',
        description: 'For growing teams.',
        billingCycle: '/month',
        button: {
          label: 'Buy now'
        }
      },
      {
        id: 'enterprise',
        title: 'Enterprise',
        price: 'Custom',
        description: 'For large organizations.',
        button: {
          label: 'Contact sales',
          color: 'neutral'
        }
      }
    ]
  }
})
</script>

<template>
  <UPricingTable />
</template>
