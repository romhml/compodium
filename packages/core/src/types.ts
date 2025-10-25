import type { UserConfig as VitestUserConfig, InlineConfig as VitestInlineConfig } from 'vitest/node'
import type { PropertyMeta as VuePropertyMeta } from '@compodium/meta'
import type { Hookable } from 'hookable'
import type { InputSchema } from './plugins/meta/infer'
import type { ViteHotContext } from 'vite/types/hot.js'

export type PluginOptions = {
  /**
   * Project root directory.
   */
  rootDir?: string

  /**
   * Project base url.
   */
  baseUrl?: string

  /**
   * Customize the directories where components are discovered
   * @defaultValue `[{ path: './src/components', pathPrefix: false }]`
   */
  componentDirs: (ComponentsDir | string)[]

  /**
   * Whether to include default collections for third-party libraries.
   * @defaultValue `true`
   */
  includeLibraryCollections?: boolean

  /**
   * Customize compodium's base directory.
   * @defaultValue `'compodium'`
   */
  dir: string

  /**
   * List of glob patterns to ignore components
   */
  ignore?: string[]

  extras?: {
    /**
     * Customize Compodium's UI Colors.
     * See: https://ui.nuxt.com/getting-started/theme#colors for acceptable values
     */
    colors?: {
      primary?: string
      neutral?: string
    }
  }

  /**
   * Configure your application's mainPath
   * @defaultValue `'src/main.ts'`
   */
  mainPath?: string

  /**
   * Testing configuration.
   */
  testing?: {
    /**
     * Enables testing integrations.
     * Note that it requires installing `@compodium/testing`.
     */
    enabled?: boolean
  }
  /* Internal */
  _nuxt?: boolean

  /* Internal */
  _vitestConfig?: Promise<TestConfig | undefined> | TestConfig
}

export type IconifyIcon = string & {}

export type * from './plugins/meta/infer'

export type PropInputType = 'array' | 'object' | 'stringEnum' | 'primitiveArray' | 'array' | 'string' | 'number' | 'boolean' | 'date' | 'icon'

type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never
type FilterStringLiteral<T> = {
  [K in keyof T]: T[K] extends StringLiteral<T[K]> ? K : never;
}[keyof T]

type ComboItem<T> = keyof FilterStringLiteral<T> | undefined
type Combo<T> = [ComboItem<T>, ComboItem<T>] | [ComboItem<T>]

export type ComponentsDir = {
  /**
   * Path (absolute or relative) to the directory containing your components.
   * You can use Nuxt aliases (~ or @) to refer to directories inside project or directly use an npm package path similar to require.
   */
  path: string
  /**
   * Accept Pattern that will be run against specified path.
   */
  pattern?: string | string[]
  /**
   * Ignore patterns that will be run against specified path.
   */
  ignore?: string[]
  /**
   * Prefix all matched components.
   */
  prefix?: string
  /**
   * Prefix component name by its path.
   */
  pathPrefix?: boolean
}

export type CompodiumMeta<T = Record<string, any>> = {
  compodium?: {
    combo?: Combo<T>
    defaultProps?: Partial<T>
  }
  props: PropertyMeta[]
  events: string[]
}

export type PropSchema = {
  inputType: PropInputType
  description?: string
  default?: string
  type: string
  schema: InputSchema
}

export type PropertyMeta = Omit<VuePropertyMeta, 'schema'> & {
  schema: PropSchema[]
}

export type Component = {
  pascalName: string
  kebabName: string
  export: string
  filePath: string
  shortPath: string
  mode?: 'client' | 'server' | 'all'
  priority?: number
  realPath: string
  wrapperComponent?: string
  docUrl?: string
  examples?: ComponentExample[]
  collectionName: string
}

export type ComponentExample = Component & {
  isExample: true
  componentPath?: string
  componentName?: string
}

export type Collection = {
  name: string
  package?: string
  icon?: string
  version?: string
  prefix?: string
  ignore?: string[]
  dirs: ComponentsDir[]
  exampleDir: ComponentsDir
  wrapperComponent?: string
  getDocUrl?: (componentName: string) => string
}

export type ComponentCollection = Collection & {
  components: (Component & Partial<ComponentExample>)[]
}

export type TestConfig = VitestUserConfig & {
  test?: VitestInlineConfig
}

export interface CompodiumHooks {
  // Triggered when the components code has been updated
  'component:changed': (path: string) => void

  // Triggered when a new component has been added
  'component:added': (path: string) => void

  // Triggered when a component has been deleted
  'component:removed': (path: string) => void

  // Triggered when a component event is triggered
  'component:event': (payload: { name: string, data: any }) => void

  // Called after the renderer has mounted
  'renderer:mounted': (hot?: ViteHotContext) => void

  // Update the renderer component
  'renderer:update-component': (payload: { path: string, props?: Record<string, any>, events?: string[], wrapper?: string }) => void

  // Update the renderer props
  'renderer:update-props': (payload: { props?: Record<string, any> }) => void

  // Update the renderer combo (displaying multiple variants)
  'renderer:update-combo': (payload: { props: { value: string, options: string[] }[] }) => void

  // Update the renderer colorMode
  'renderer:set-color': (color: 'light' | 'dark') => void

  // Toggle the renderer grid
  'renderer:grid': (payload: { enabled: boolean, gap: number }) => void
}

declare global {
  interface Window {
    /**
     * Compodium Hooks for the renderer and devtools
     */
    __COMPODIUM_HOOKS__?: Hookable<CompodiumHooks>

  }

  /**
   * Macro to configure components and examples.
   */
  function extendCompodiumMeta<T = Record<string, any>>(_options: CompodiumMeta<T>['compodium']): void
}
