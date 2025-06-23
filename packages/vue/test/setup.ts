import { expect } from 'vitest'

expect.extend({
  toContainComponent(received, expected) {
    const expectedStructure = expect.arrayContaining([
      expect.objectContaining({
        name: 'Components',
        components: expect.arrayContaining([
          expect.objectContaining(expected)
        ])
      })
    ])

    try {
      // Use the equals utility from the matcher context
      const pass = this.equals(received, expectedStructure)

      return {
        pass,
        message: () => pass
          ? `Expected array not to contain component ${JSON.stringify(expected)}`
          : `Expected array to contain component ${JSON.stringify(expected)}`
      }
    } catch {
      return {
        pass: false,
        message: () => `Expected array to contain component ${JSON.stringify(expected)}`
      }
    }
  }
})
