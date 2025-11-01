import { expect, it } from 'vitest'
import { describeComponent } from '@compodium/testing/unit'

describeComponent('SupportedProps', ({ props }) => {
  it('includes default props', () => {
    expect(props?.string).toEqual('hello')
  })
})
