import { it, expect } from 'vitest'
import { describeComponents } from '@compodium/testing/unit'
import { mount } from '@vue/test-utils'

describeComponents(({ component, props }) => {
  it('snapshot', () => {
    const wrapper = mount(component, { props })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
