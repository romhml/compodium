export type CompodiumMeta<T> = {
  defaultProps?: T
  example?: string
  ignore?: boolean
  ignoreProps?: string[]
}

export function extendCompodiumMeta<T>(_meta: CompodiumMeta<T>) { }
