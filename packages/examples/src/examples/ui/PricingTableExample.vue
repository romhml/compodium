<script setup lang="ts">
import { ref } from 'vue'

const tiers = ref([
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
])
const sections = ref([
  {
    title: 'Features',
    features: [
      {
        title: 'Number of developers',
        tiers: {
          solo: '1',
          team: '5',
          enterprise: 'Unlimited'
        }
      },
      {
        title: 'Projects',
        tiers: {
          solo: true,
          team: true,
          enterprise: true
        }
      }
    ]
  },
  {
    title: 'Security',
    features: [
      {
        title: 'SSO',
        tiers: {
          solo: false,
          team: true,
          enterprise: true
        }
      }
    ]
  }
])
</script>

<template>
  <UPricingTable
    :tiers="tiers"
    :sections="sections"
  />
</template>
