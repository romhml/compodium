<div align="center">
  
# Compodium

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A plug and play component playground for Nuxt.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/7e354f8f-72cb-43ee-bbc3-857bb665e841">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/e743a4c6-4845-4320-9cef-437e3890f05b">
  <img alt="Compodium" src="https://github.com/user-attachments/assets/e743a4c6-4845-4320-9cef-437e3890f05b">
</picture>


[Try it live!](https://codesandbox.io/p/devbox/compodium-jkxt32)
</div>

> [!WARNING]
> This project is in its early stages and will evolve. Expect frequent updates and potential changes. Feedback is welcome!

## Features

- **Easy Setup and Use:** Easily integrates into your Nuxt app with minimal configuration. Customize only when needed by creating examples or defining default props.
- **HMR Support:** Enables real-time updates with HMR for faster development.
- **Default UI Collections:** Comes with pre-configured collections for your UI libraries.

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add compodium
```

That's it! You can now access Compodium from the nuxt devtools or `/__compodium__/devtools`.

## Configuration

Configure Compodium in your Nuxt project by customizing the settings in your `nuxt.config.ts` file. Below is the default configuration, which you can modify to suit your needs:

```ts
export default defineNuxtConfig({
  compodium: {
    /* Whether to include default collections for third-party libraries. */
    includeLibraryCollections: true,

    /* Customize compodium's base directory */
    dir: 'compodium/',

    extras: {
      ui: {
        /* If true, Compodium's UI will match your Nuxt UI color theme */
        matchColors: true
      }
    }
  }
})
```

### Preview Component

Compodium renders your components in an isolated preview component that is mounted into your Nuxt application. You can customize this preview component by creating your own in `compodium/preview.vue`.

Here's the default preview component you can start from:

```vue
<template>
  <div id="compodium-preview">
    <slot />
  </div>
</template>

<style>
html {
  background: var(--ui-bg, white);
}

html.dark {
  background: var(--ui-bg, #18181b);
}

body {
  margin: 0;
  padding: 0;
}

#compodium-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  padding: 20px;
}
</style>
```

> [!NOTE]
> Compodium renders outside of your `app.vue` component. This is useful if you need to inject CSS or provide parent components.

### Component Examples

You can provide examples for your components in the `compodium/examples/` folder. Examples will be matched to components based on the filename. Each example must be named after its corresponding component, followed by the `Example` keyword and an optional label.

```bash
compodium
└── examples
    ├── BaseInputExampleDisabled.vue    # Will be added to the BaseInput component.
    ├── BaseButtonExample.vue           # Will be the main example for the BaseButton component.
    └── BaseButtonExampleWithLabel.vue  # Will be added to the BaseButton component.
```

### Default Props

You can use the `extendCompodiumMeta` in your component or in examples to pass default values for required properties:
```ts
const props = defineProps<{ label: string }>()

extendCompodiumMeta({
  defaultProps: {
    label: 'Click me!'
  }
})
```
> [!WARNING]
> `extendCompodiumMeta` is a macro that is evaluated at compile time. As such, you can only use literal values, and can't reference variables.

Alternatively, you can specify default properties for your components in your `app.config.ts` file:

```ts
export default defineAppConfig({
  compodium: {
    components: {
      baseButton: {
        label: 'Click me!'
      }
    }
  }
})
```

## Contribution
Contributions are welcome! ♥️

Currently, one way you can contribute is by adding examples for your favorite component library. You can find the Nuxt UI collection and examples [here](https://github.com/romhml/compodium/tree/main/src/runtime/libs).

**Local development**

```bash
# Install dependencies
pnpm install

# Generate type stubs
pnpm dev:prepare

# Develop with the playground
pnpm dev

# Run ESLint
pnpm lint

# Run typechecks 
pnpm typechecks 

# Run Vitest
pnpm test
pnpm test:watch
```


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/compodium/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/compodium

[npm-downloads-src]: https://img.shields.io/npm/dm/compodium.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/compodium

[license-src]: https://img.shields.io/npm/l/compodium.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/compodium

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
