import { expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describeComponent } from '@compodium/testing/unit'

describeComponent('CompodiumWelcome', ({ component, props }) => {
  it('works', async () => {
    const wrapper = await mountSuspended(component, { props })
    const instance = wrapper.findComponent({ name: 'CompodiumWelcome' })
    expect(instance.exists()).toBe(true)
  })

  it('snapshot', async () => {
    const wrapper = await mountSuspended(component, { props })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
