# Compodium

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

🚧 Still under construction 🚧

A plug and play interactive component playground for your Nuxt projects.


- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/your-org/compodium?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## Features

<!-- Highlight some of the features your module provide here -->
- ⛰  &nbsp; Automatically discovers your components (including libraries). 
- ⚡ &nbsp; HMR support.

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add compodium
```

That's it! You can now access Compodium from the nuxt devtools or `/__compodium__/devtools`.

## Contribution

<details>
  <summary>Local development</summary>
  
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

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/compodium/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/compodium

[npm-downloads-src]: https://img.shields.io/npm/dm/compodium.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/compodium

[license-src]: https://img.shields.io/npm/l/compodium.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/compodium

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
