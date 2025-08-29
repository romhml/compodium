import { expect, it } from 'vitest'
import { describeComponent } from '@compodium/testing/unit'
import { mount } from '@vue/test-utils'

describeComponent('CompodiumWelcome', ({ component, props }) => {
  it('includes default props', () => {
    expect(props?.bounceIt).toEqual(true)
  })

  it('works', () => {
    const wrapper = mount(component, { props })
    const instance = wrapper.findComponent({ name: 'CompodiumWelcome' })
    expect(instance.exists()).toBe(true)
  })

  it('snapshot', () => {
    const wrapper = mount(component, { props })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
