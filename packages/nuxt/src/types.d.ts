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
