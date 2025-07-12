import { createSharedComposable } from '@vueuse/core'
import type { ViteHotContext } from 'vite/types/hot.js'

function _useViteClient() {
  const { hooks } = useCompodiumClient()
  let hot: ViteHotContext | undefined = undefined

  hooks.hook('renderer:mounted', (_hot?: ViteHotContext) => {
    hot = _hot

    for (const [e, fns] of Object.entries(viteHandlers.value)) {
      fns?.forEach(fn => hot?.on(e, fn))
    }

    viteHandlers.value = {}
  })

  const viteHandlers = shallowRef<Record<string, ((payload: any) => void)[]>>({})

  function onEvent(e: string, fn: (payload: any) => void) {
    if (hot) hot.on(e, fn)
    else {
      viteHandlers.value[e] ??= []
      viteHandlers.value[e].push(fn)
    }
  }

  return {
    onEvent
  }
}

export const useViteClient = createSharedComposable(_useViteClient)
