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

  test('this one also doesn\'t', () => {
    expect(1).toBe(1)
  })

  test('custom screenshot', async () => {
    await expect(page.getByTestId('preview')).toMatchScreenshot('Welcome.png')
  })

  test('this one has a very very very long name very very very very', async () => {
    expect(1).toBe(1)
  })

  describe('nested describe', () => {
    test('this nested one also does', () => {
      expect(1).toBe(1)
    })
  })
})
