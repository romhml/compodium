import { it, expect } from 'vitest'
import { describeComponents } from '@compodium/testing/unit'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describeComponents(({ component, props }) => {
  it('snapshot', async () => {
    const wrapper = await mountSuspended(component, { props })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
