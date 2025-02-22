import { shallowRef } from 'vue'
import { useState } from '#imports'

export type ExtendCompodiumMetaOptions<T> = {
  defaultProps: T
}

export function _useCompodiumMetaState() {
  const defaultProps = useState<Record<string, any> | null>('__compodium-meta', () => shallowRef({}))
  return {
    defaultProps
  }
}

/**
 * Define default props for the component's preview.
 */
export function extendCompodiumMeta<T = Record<string, any>>(options: ExtendCompodiumMetaOptions<T>) {
  if (!import.meta.dev) return
  const { defaultProps } = _useCompodiumMetaState()
  defaultProps.value = options.defaultProps as any
}
