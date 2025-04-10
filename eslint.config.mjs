import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      commaDangle: 'never',
      braceStyle: '1tbs'
    }
  },
  dirs: {
    src: [
      './playground'
    ]
  }
}).overrideRules({
  'import/first': 'off',
  'import/order': 'off',
  'vue/multi-word-component-names': 'off',
  '@typescript-eslint/no-explicit-any': 'off'
}).prepend({
  ignores: ['scripts/_utils.ts']
})
