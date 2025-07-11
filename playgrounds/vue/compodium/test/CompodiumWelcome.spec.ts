import { test, expect } from 'vitest'
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
})
