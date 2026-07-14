import { $fetch } from '@nuxt/test-utils/e2e'

export async function loadNativeModule<T>(path: string, query?: Record<string, string>): Promise<T> {
  const search = query ? `?${new URLSearchParams(query)}` : ''
  const source = await $fetch<string>(`${path}${search}`, {
    headers: { accept: 'text/javascript' }
  })
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  return (await import(moduleUrl)).default as T
}
