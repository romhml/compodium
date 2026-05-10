# Compodium Monorepo Project

This is a Compodium monorepository in TypeScript. The project uses **pnpm workspaces** for package management.

## Project Structure

- `packages/` - Contains all workspace packages (functions, core, web, etc.)
- `docs/` - Documentation website
- `playgrounds/` - Integration testing environments for Vue and Nuxt

## Code Standards

- Use TypeScript with strict mode enabled
- Follow ESLint rules with Nuxt-specific configurations

## Monorepo Conventions

- **Dependency Management**: Use `pnpm` for all package installations and scripts.
- **Workspaces**: All packages are defined in the `packages/` directory.
- **Playgrounds**: Test integrations in `playgrounds/vue` and `playgrounds/nuxt`.

## Scripts

- `dev`: Run development mode for all packages.
- `dev:nuxt`: Run development mode for Nuxt playground.
- `dev:vue`: Run development mode for Vue playground.
- `dev:docs`: Run development mode for documentation.
- `lint`: Run ESLint for code quality checks.
- `typecheck`: Run TypeScript type checking across all packages.
- `test`: Run Vitest for unit and integration tests.

## Testing

- **Framework**: Vitest
- **Configuration**: Tests are defined in `vitest.config.ts` and run across all packages.

## Linting

- **Framework**: ESLint
- **Configuration**: Uses `@nuxt/eslint-config` with custom overrides for stylistic and tooling rules.

## Build

- **Framework**: tsdown
- **Configuration**: tsdown is used for building packages.

