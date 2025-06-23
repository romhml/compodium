import 'vitest'

interface CustomMatchers<R = unknown> {
  toContainComponent(expected: Record<string, any>): R
}

declare module 'vitest' {
  interface Matchers {
    toContainComponent(expected: Record<string, any>): R
  }
}
