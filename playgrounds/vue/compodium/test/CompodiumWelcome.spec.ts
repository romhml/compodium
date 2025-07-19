import { test, expect, describe } from 'vitest'
import { describeComponent, page } from '@compodium/testing/e2e'

describeComponent('CompodiumWelcome', () => {
  test('it works', () => {
    const button = page.getByTestId('go-to-compodium')
    expect(button).toBeVisible()
  })

  test('it works again', () => {
    const button = page.getByTestId('open-devtools')
    expect(button).toBeVisible()
  })

  test('this one doesn\'t', () => {
    const button = page.getByTestId('unknown')
    expect(button).toBeVisible()
  })

  test('this one also doesn\'t', () => {
    expect(1).toBe(2)
  })

  test('custom screenshot', async (context) => {
    await expect(page.getByTestId('preview')).toMatchScreenshot('Welcome.png', context)
  })

  test('this one has a very very very long name very very very very', async () => {
    expect(1).toBe(2)
  })

  // TODO: Handle nested suites?
  describe('nested describe', () => {
    test('this nested one also doesn\'t', () => {
      expect(1).toBe(2)
    })
  })
})
