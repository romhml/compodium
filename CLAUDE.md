# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev:prepare      # Generate type stubs (run after install or package changes)
pnpm dev              # Start all packages in parallel (devtools + playgrounds)
pnpm dev:nuxt         # Start devtools + Nuxt playground only
pnpm dev:vue          # Start devtools + Vue playground only
pnpm lint             # ESLint
pnpm typecheck        # TypeScript checks across all packages
pnpm test             # Run all Vitest tests
```

Run tests for a specific package:
```bash
pnpm --filter @compodium/vue test
pnpm --filter @compodium/nuxt test
```

Run a single test file:
```bash
pnpm vitest run packages/vue/test/basic.spec.ts
```

The `COMPODIUM_DEVTOOLS_URL` env var proxies the devtools UI to a separately running instance (default: `http://localhost:4242`). The root `pnpm dev` sets this automatically.

## Architecture

Compodium is a **component playground** for Vue/Nuxt. It integrates into Vite as a set of plugins and exposes a devtools UI at `/__compodium__/devtools`.

### Packages

| Package | Purpose |
|---|---|
| `@compodium/core` | All Vite plugins — the engine |
| `@compodium/vue` | Vue wrapper: wires `core` + renderer + Vue devtools integration |
| `@compodium/nuxt` | Nuxt module: wires `core` into Nuxt hooks, adds devtools tab |
| `@compodium/devtools` | Nuxt app that IS the devtools UI (built to `core/dist/client/devtools`) |
| `@compodium/examples` | Static library collections (e.g. Nuxt UI component examples) |

### Core Vite plugins (`packages/core/src/plugins/`)

Each plugin registers Vite middleware under `/__compodium__/api/*`:

- **`collections`** — scans component dirs (user + library) and serves `/api/collections`. Watches for file changes via chokidar.
- **`meta`** — serves `/api/meta?component=<path>`. Uses `vue-component-meta` (`createCheckerByJson`) to extract prop types. `extendMetaPlugin` uses `unplugin-ast` to strip `extendCompodiumMeta()` calls from production builds.
- **`devtools`** — serves the pre-built devtools SPA via `sirv`. In dev mode (`COMPODIUM_DEVTOOLS_URL`), proxies to the separately running devtools server instead.
- **`examples`** — resolves example files for components.
- **`colors`**, **`iconify`** — auxiliary plugins for UI theming and icon support.

### Prop type inference (`packages/core/src/plugins/meta/infer.ts`)

`vue-component-meta` returns raw TypeScript schema objects. `inferPropTypes` maps these to `PropInputType` values (`string`, `number`, `boolean`, `stringEnum`, `array`, `object`, `date`, `icon`) using Zod schemas for pattern matching. This drives the devtools prop editor UI.

### `extendCompodiumMeta` macro

Components can call `extendCompodiumMeta({ defaultProps, combo })` in `<script setup>`. The `compodium-meta` parser uses `@vue/compiler-sfc` + `oxc-parser` to statically extract this at dev time. The `extendMetaPlugin` removes these calls from the build output via AST transform.

### Devtools UI (`packages/devtools/`)

A standalone Nuxt app (SSR disabled) that lives at `/__compodium__/devtools`. Communicates with the host app through `window.__COMPODIUM_HOOKS__` (a `hookable` instance defined in `CompodiumHooks`). Key hooks: `renderer:update-component`, `renderer:update-props`, `renderer:update-combo`, `component:changed`.

The renderer (`/__compodium__/renderer`) is injected into the host app as a virtual module (`virtual:compodium:preview`), resolved to either a user-defined `compodium/preview.vue` or the default runtime preview.

### Testing

- **Vue package**: Vitest unit/integration tests using `supertest` against a real Vite dev server spun up per test suite (`packages/vue/test/utils.ts`).
- **Nuxt package**: `@nuxt/test-utils` e2e tests; `setup()` spins up a real Nuxt dev server per suite. Slow (~30s timeout).
- **Devtools package**: Vitest tests for codegen logic.

Nuxt tests set `COMPODIUM_DEVTOOLS_URL` to skip serving the built devtools assets. `COMPODIUM_TEST=true` skips devtools middleware entirely.
