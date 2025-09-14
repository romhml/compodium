import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describeComponent } from '@compodium/testing/unit'

describe('test', () => {
  describeComponent('CompodiumWelcome', ({ component, props }) => {
    it('includes default props', () => {
      expect(props?.bounceIt).toEqual(true)
    })

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
})
