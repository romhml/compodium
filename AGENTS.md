# AGENTS.md

## Repo shape
- pnpm workspace (`pnpm@10.19.0`) with `docs/`, `packages/*`, and `playgrounds/*` from `pnpm-workspace.yaml`.
- Main packages: `@compodium/core` (Vite/unplugin pipeline and runtime), `@compodium/vue` (Vite plugin wrapper), `@compodium/nuxt` (Nuxt module), private `@compodium/devtools` (Nuxt app on port 4242), and `@compodium/examples`.
- Source is ESM TypeScript/Vue. Shared build defaults live in root `build.config.ts`; package builds use `unbuild`, except the Nuxt module uses `nuxt-module-build`.
- `.npmrc` defaults to `filter=@compodium/*`, `shamefully-hoist=true`, and `strict-peer-dependencies=false`; account for the implicit filter when running pnpm commands.

## Commands
- Install: `pnpm install`
- Generate local stubs/prepare Nuxt apps: `pnpm dev:prepare`
- Dev all: `pnpm dev` (sets `COMPODIUM_DEVTOOLS_URL=http://localhost:4242`)
- Focused dev: `pnpm dev:nuxt`, `pnpm dev:vue`, or `pnpm dev:docs`
- Lint: `pnpm lint`
- Typecheck all workspaces: `pnpm typecheck` (not `pnpm typechecks`; README has a stale plural typo)
- Tests: `pnpm test`
- Focused tests: `pnpm test -- packages/vue/test/basic.spec.ts`, `pnpm test -- packages/nuxt/test/basic.nuxt.test.ts`, `pnpm test -- packages/devtools/test/codegen.test.ts`, or `pnpm test -- -t "basic"`
- Focused filters: `pnpm --filter @compodium/vue typecheck`, `pnpm --filter @compodium/nuxt typecheck`, `pnpm --filter devtools dev`

## Gotchas
- Run `pnpm dev:prepare` after dependency changes or before local dev/typecheck if workspace package stubs or Nuxt generated types are missing.
- Root Vitest sets `COMPODIUM_TEST=true`; Nuxt Vitest also sets `COMPODIUM_DEVTOOLS_URL=http://localhost:4242` and loads Vue matcher setup.
- Nuxt tests and dev expect the devtools app URL to be `http://localhost:4242`; root `dev:*` scripts set it automatically.
- The Nuxt module is dev-only: `packages/nuxt/src/module.ts` returns early when `!nuxt.options.dev`.
- Keep Vite pinned through root `resolutions.vite`; do not casually bump only a subpackage Vite version.
- `@compodium/core` prepack/build runs `unbuild && pnpm --filter devtools generate`; generated devtools output lands in `packages/core/dist/client/devtools`.
- `@compodium/devtools` is a private Nuxt app with SSR disabled, base URL `/__compodium__/devtools`, and default port `4242`.
- `@compodium/examples` prepack first generates Tailwind CSS from `src/assets/ui/base.css` into `src/assets/ui/index.css`.
- ESLint uses Nuxt flat config with stylistic rules (`commaDangle: 'never'`, `braceStyle: '1tbs'`) and intentionally allows `any`.
