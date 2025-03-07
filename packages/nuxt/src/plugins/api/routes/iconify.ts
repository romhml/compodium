import { type H3Event, getQuery, defineEventHandler } from 'h3'
import { joinURL } from 'ufo'

export default defineEventHandler(async (event: H3Event) => {
  const { q } = getQuery(event)
  return $fetch(joinURL('https://api.iconify.design', q as string))
}) /* , {
  group: 'compodium',
  name: 'iconify',
  getKey(event: H3Event) {
    return getQuery(event)?.q?.toString() ?? ''
  },
  swr: true,
  maxAge: 60 * 60 * 24 * 7
}) */
