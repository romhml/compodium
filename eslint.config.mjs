import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: true,
  },
  dirs: {
    src: [
      './playground',
    ],
  },
}).overrideRules({
  '@typescript-eslint/no-explicit-any': 'off',
}).prepend({
  ignores: ['src/devtools/.component-meta'],
})
