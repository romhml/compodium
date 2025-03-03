import { defineCachedEventHandler, getQuery } from '#imports'
import type { H3Event } from 'h3'
import { joinURL } from 'ufo'

export default defineCachedEventHandler(async (event) => {
  const { q } = getQuery(event)
  return $fetch(joinURL('https://api.iconify.design', q))
}, {
  group: 'compodium',
  name: 'iconify',
  getKey(event: H3Event) {
    return getQuery(event)?.q?.toString() ?? ''
  },
  swr: true,
  maxAge: 60 * 60 * 24 * 7
})
