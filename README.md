<div align="center">
  
# Compodium

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A plug and play component playground for Vue and Nuxt.

[Documentation](https://compodium.dev/getting-started)

</div>

> [!WARNING]
> This project is in its early stages and will evolve. Expect frequent updates and potential changes. Feedback is welcome!

## Features

- **Effortless Setup**: Simple setup process and minimal maintenance, allowing you to focus on building components.
- **No Stories Required**: Analyzes your component code directly, eliminating the need to write stories.
- **Fast**: Built on top of Vite for rapid development and instant feedback, enhancing productivity.
- **DevTools Integration**: Integrates with Vue and Nuxt devtools for a cohesive development experience.
- **UI Library Integrations**: Integrates with popular UI libraries, showcasing examples for locally installed components.
- **Code generation**: Generates up-to-date template code based on component props, ready to copy and use instantly.


## Installation

### Nuxt

```bash
npx nuxi@latest module add --dev compodium
```

### Vue

1. Install `@compodium/vue`

```bash [pnpm]
pnpm add -D @compodium/vue
```

```bash [yarn]
yarn add --dev @compodium/vue
```

```bash [npm]
npm install --save-dev @compodium/vue
```

```bash [bun]
bun add -D @compodium/vue
```

2. Add the Compodium plugin in your `vite.config.ts`:

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { compodium } from '@compodium/vue'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    compodium()
  ]
})
```

3. Include compodium types in your `tsconfig.app.json`

```json [tsconfig.app.json]{6}
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "node_modules/@compodium/vue/dist/index.d.ts"
  ],
}
```

## Contribution
Contributions are welcome! ♥️

Currently, one way you can contribute is by adding examples for your favorite component library. You can find the Nuxt UI collection and examples [here](https://github.com/romhml/compodium/tree/main/packages/examples/src/index.ts).

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
```

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/%40compodium%2Fcore/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/%40compodium%2Fcore

[npm-downloads-src]: https://img.shields.io/npm/dm/compodium.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/%40compodium%2Fcore

[license-src]: https://img.shields.io/npm/l/compodium.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/compodium

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
